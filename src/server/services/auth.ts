import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema as s } from '../db/client'
import { badRequest, conflict, forbidden, unauthorized } from '../http'

export const SESSION_COOKIE = 'es_session'
const SESSION_DAYS = 30

export type SessionUser = { id: number; name: string; email: string; phone: string | null; role: 'PENGGUNA' | 'ADMIN' }

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120),
  email: z.email('Email tidak valid.').transform((v) => v.toLowerCase()),
  phone: z.string().trim().regex(/^(\+62|62|0)8\d{7,12}$/, 'Nomor WhatsApp tidak valid, contoh 081234567890.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(200),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3, 'Email wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

export function normalizePhone(p: string) {
  const digits = p.replace(/\D/g, '')
  if (digits.startsWith('62')) return '0' + digits.slice(2)
  return digits
}

export async function register(input: unknown) {
  const data = registerSchema.parse(input)
  const db = await getDb()
  const exists = await db.query.users.findFirst({ where: eq(s.users.email, data.email) })
  if (exists) throw conflict('Email sudah terdaftar. Silakan masuk.')
  const [user] = await db
    .insert(s.users)
    .values({ name: data.name, email: data.email, phone: normalizePhone(data.phone), passwordHash: await bcrypt.hash(data.password, 10), role: 'PENGGUNA' })
    .returning()
  await startSession(user.id)
  return toSessionUser(user)
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input)
  const db = await getDb()
  const user = await db.query.users.findFirst({ where: eq(s.users.email, data.email) })
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw badRequest('Email atau kata sandi salah.')
  }
  await startSession(user.id)
  return toSessionUser(user)
}

export async function logout() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    const db = await getDb()
    await db.delete(s.sessions).where(eq(s.sessions.id, sha256(token)))
  }
  jar.delete(SESSION_COOKIE)
}

async function startSession(userId: number) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000)
  const db = await getDb()
  await db.insert(s.sessions).values({ id: sha256(token), userId, expiresAt })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

function toSessionUser(u: typeof s.users.$inferSelect): SessionUser {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role }
}

/** Pengguna aktif untuk request ini (null bila belum masuk). Di-cache per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const db = await getDb()
  const rows = await db
    .select({ user: s.users })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
    .where(and(eq(s.sessions.id, sha256(token)), gt(s.sessions.expiresAt, new Date())))
    .limit(1)
  return rows[0] ? toSessionUser(rows[0].user) : null
})

export async function requireUser() {
  const u = await getCurrentUser()
  if (!u) throw unauthorized()
  return u
}

export async function requirePengguna() {
  const u = await requireUser()
  if (u.role !== 'PENGGUNA') throw forbidden('Fitur ini khusus akun Pengguna.')
  return u
}

export async function requireAdmin() {
  const u = await requireUser()
  if (u.role !== 'ADMIN') throw forbidden('Fitur ini khusus Admin.')
  return u
}
