import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, asc, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import { getDb, schema as s } from '../db/client'
import { badRequest, conflict, forbidden, notFound } from '../http'
import { CATEGORY_OPTIONS } from '@/lib/labels'
import { maskName } from '@/lib/format'
import type { SessionUser } from './auth'
import { getOwnedShipment } from './shipments'
import { audit, systemMessage } from './audit'

const STAGE_HOURS = 72

export function stripHtml(html: string) {
  const NL = '\n'
  const withBreaks = html.replace(/<\/(p|li|ol|ul)>|<br\s*\/?>/gi, (m) => m + NL)
  return sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .split(NL)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(NL)
}

export function cleanStory(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ol', 'ul', 'li'],
    allowedAttributes: { li: ['data-list'] },
  })
}

const createSchema = z
  .object({
    awb: z.string().min(4),
    category: z.enum(CATEGORY_OPTIONS.map((o) => o.value) as [string, ...string[]], { message: 'Pilih jenis masalah.' }),
    categoryOther: z.string().trim().max(200).optional().nullable(),
    storyHtml: z.string().max(20000),
    evidenceIds: z.array(z.number().int()).max(30).default([]),
    contactChannel: z.enum(['whatsapp', 'email']),
  })
  .superRefine((v, ctx) => {
    if (v.category === 'LAINNYA' && !v.categoryOther?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['categoryOther'], message: 'Jelaskan masalah Anda pada kolom Lainnya.' })
    }
  })

async function nextCaseCode(tx: Pick<Awaited<ReturnType<typeof getDb>>, 'select'>) {
  const rows = await tx.select({ n: sql<number>`coalesce(max(cast(substring(${s.cases.code} from 4) as integer)), 400)` }).from(s.cases)
  const n = Number(rows[0]?.n ?? 400) + 1
  return `KS-${String(n).padStart(4, '0')}`
}

export async function createCase(user: SessionUser, input: unknown) {
  const data = createSchema.parse(input)
  const shipment = await getOwnedShipment(data.awb, user)
  const storyHtml = cleanStory(data.storyHtml)
  const storyText = stripHtml(storyHtml)
  if (storyText.length < 10) throw badRequest('Ceritakan masalah Anda minimal 10 karakter.')

  const db = await getDb()
  const open = await db.query.cases.findFirst({
    where: and(eq(s.cases.shipmentId, shipment.id), eq(s.cases.reporterId, user.id), sql`${s.cases.status} <> 'SELESAI'`),
  })
  if (open) throw conflict(`Masih ada kasus terbuka untuk paket ini (${open.code}).`)

  const evRows = data.evidenceIds.length
    ? await db.select().from(s.evidence).where(and(inArray(s.evidence.id, data.evidenceIds), eq(s.evidence.shipmentId, shipment.id), isNull(s.evidence.deletedAt)))
    : []
  if (evRows.length !== data.evidenceIds.length) throw badRequest('Ada bukti yang tidak valid.')

  const firstMismatch = await db.query.identityChecks.findFirst({
    where: and(eq(s.identityChecks.shipmentId, shipment.id), eq(s.identityChecks.isFirstMismatch, true)),
  })

  return db.transaction(async (tx) => {
    const code = await nextCaseCode(tx)
    const now = new Date()
    const [c] = await tx
      .insert(s.cases)
      .values({
        code,
        shipmentId: shipment.id,
        reporterId: user.id,
        category: data.category as (typeof s.cases.$inferInsert)['category'],
        categoryOther: data.category === 'LAINNYA' ? data.categoryOther!.trim() : null,
        storyHtml,
        storyText,
        contactChannel: data.contactChannel,
        priority: firstMismatch || data.category === 'TERTUKAR' ? 'tinggi' : 'sedang',
        stageStartedAt: now,
        stageDeadline: new Date(now.getTime() + STAGE_HOURS * 3600_000),
      })
      .returning()
    if (evRows.length) {
      await tx.insert(s.caseEvidence).values(evRows.map((e) => ({ caseId: c.id, evidenceId: e.id })))
      await tx.update(s.evidence).set({ lockedAt: now }).where(and(inArray(s.evidence.id, evRows.map((e) => e.id)), isNull(s.evidence.lockedAt)))
    }
    await tx.insert(s.caseValidations).values({ caseId: c.id })
    await tx.insert(s.messages).values({ caseId: c.id, senderRole: 'pelapor', senderId: user.id, body: storyText })
    await audit(tx, { caseId: c.id, actor: null, action: 'kasus_dibuat', detail: `Laporan dibuat oleh pelapor dengan ${evRows.length} bukti terlampir` })
    if (firstMismatch) {
      await audit(tx, { caseId: c.id, action: 'perbandingan_otomatis', detail: `Perbandingan identitas otomatis: ketidakcocokan pertama di ${firstMismatch.hub}` })
    }
    return c
  })
}

export async function listMyCases(user: SessionUser) {
  const db = await getDb()
  return db
    .select({ code: s.cases.code, status: s.cases.status, category: s.cases.category, categoryOther: s.cases.categoryOther, createdAt: s.cases.createdAt, awb: s.shipments.awb })
    .from(s.cases)
    .innerJoin(s.shipments, eq(s.shipments.id, s.cases.shipmentId))
    .where(eq(s.cases.reporterId, user.id))
    .orderBy(desc(s.cases.createdAt))
}

async function loadCase(code: string) {
  const db = await getDb()
  const c = await db.query.cases.findFirst({ where: eq(s.cases.code, code.toUpperCase()) })
  if (!c) throw notFound('Kasus tidak ditemukan.')
  return c
}

export async function getCaseForViewer(code: string, viewer: SessionUser) {
  const c = await loadCase(code)
  if (viewer.role !== 'ADMIN' && c.reporterId !== viewer.id) throw forbidden('Kasus ini bukan milik Anda.')
  return getCaseBundle(c.id)
}

/** Data lengkap satu kasus (dipakai pengguna & admin). */
export async function getCaseBundle(caseId: number) {
  const db = await getDb()
  const c = (await db.query.cases.findFirst({ where: eq(s.cases.id, caseId) }))!
  const [shipment, reporter, evidence, msgs, logs, validation, trace, share, assignee] = await Promise.all([
    db.query.shipments.findFirst({ where: eq(s.shipments.id, c.shipmentId) }),
    db.query.users.findFirst({ where: eq(s.users.id, c.reporterId) }),
    db
      .select({ ev: s.evidence })
      .from(s.caseEvidence)
      .innerJoin(s.evidence, eq(s.evidence.id, s.caseEvidence.evidenceId))
      .where(eq(s.caseEvidence.caseId, c.id))
      .orderBy(asc(s.evidence.id)),
    db.select().from(s.messages).where(eq(s.messages.caseId, c.id)).orderBy(asc(s.messages.createdAt), asc(s.messages.id)),
    db.select().from(s.auditLogs).where(eq(s.auditLogs.caseId, c.id)).orderBy(desc(s.auditLogs.createdAt), desc(s.auditLogs.id)),
    db.query.caseValidations.findFirst({ where: eq(s.caseValidations.caseId, c.id) }),
    db.select().from(s.traceLocations).where(eq(s.traceLocations.caseId, c.id)).orderBy(asc(s.traceLocations.seq)),
    db.query.shareLinks.findFirst({
      where: and(eq(s.shareLinks.caseId, c.id), isNull(s.shareLinks.revokedAt), gt(s.shareLinks.expiresAt, new Date())),
      orderBy: desc(s.shareLinks.createdAt),
    }),
    c.assigneeId ? db.query.users.findFirst({ where: eq(s.users.id, c.assigneeId) }) : Promise.resolve(undefined),
  ])
  return {
    case: c,
    shipment: shipment!,
    reporter: { id: reporter!.id, name: reporter!.name, masked: maskName(reporter!.name), email: reporter!.email, phone: reporter!.phone },
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    evidence: evidence.map((r) => r.ev),
    messages: msgs,
    audit: logs,
    validation: validation ?? null,
    trace,
    share: share ? { token: share.token, expiresAt: share.expiresAt } : null,
  }
}

export type CaseBundle = Awaited<ReturnType<typeof getCaseBundle>>

const messageSchema = z.object({ body: z.string().trim().min(1, 'Pesan tidak boleh kosong.').max(4000) })

export async function postMessage(code: string, viewer: SessionUser, input: unknown) {
  const { body } = messageSchema.parse(input)
  const c = await loadCase(code)
  const isAdmin = viewer.role === 'ADMIN'
  if (!isAdmin && c.reporterId !== viewer.id) throw forbidden('Kasus ini bukan milik Anda.')
  const db = await getDb()
  return db.transaction(async (tx) => {
    const [m] = await tx
      .insert(s.messages)
      .values({ caseId: c.id, senderRole: isAdmin ? 'admin' : 'pelapor', senderId: viewer.id, body })
      .returning()
    if (isAdmin) await audit(tx, { caseId: c.id, actor: viewer, action: 'reply', detail: 'Reply dikirim ke pelapor' })
    return m
  })
}

export async function listMessages(code: string, viewer: SessionUser, afterId = 0) {
  const c = await loadCase(code)
  if (viewer.role !== 'ADMIN' && c.reporterId !== viewer.id) throw forbidden('Kasus ini bukan milik Anda.')
  const db = await getDb()
  const rows = await db
    .select()
    .from(s.messages)
    .where(and(eq(s.messages.caseId, c.id), gt(s.messages.id, afterId)))
    .orderBy(asc(s.messages.createdAt), asc(s.messages.id))
  return { messages: rows, status: c.status }
}

export async function escalateCase(code: string, user: SessionUser) {
  const c = await loadCase(code)
  if (c.reporterId !== user.id) throw forbidden('Kasus ini bukan milik Anda.')
  if (c.status === 'SELESAI') throw conflict('Kasus sudah selesai.')
  if (c.escalatedAt) throw conflict('Kasus sudah dieskalasi.')
  if (c.stageDeadline.getTime() > Date.now()) throw conflict('Eskalasi aktif setelah batas waktu tahap terlewat.')
  const db = await getDb()
  await db.transaction(async (tx) => {
    await tx.update(s.cases).set({ escalatedAt: new Date(), priority: 'tinggi' }).where(eq(s.cases.id, c.id))
    await audit(tx, { caseId: c.id, actor: user, action: 'eskalasi', detail: 'Pelapor mengeskalasi kasus karena batas waktu terlewat' })
    await systemMessage(tx, c.id, 'Kasus dieskalasi oleh pelapor. Prioritas dinaikkan menjadi tinggi.')
  })
  return { ok: true }
}

export async function createShareLink(code: string, user: SessionUser) {
  const c = await loadCase(code)
  if (c.reporterId !== user.id) throw forbidden('Kasus ini bukan milik Anda.')
  const db = await getDb()
  const existing = await db.query.shareLinks.findFirst({
    where: and(eq(s.shareLinks.caseId, c.id), isNull(s.shareLinks.revokedAt), gt(s.shareLinks.expiresAt, new Date())),
  })
  if (existing) return existing
  const [link] = await db
    .insert(s.shareLinks)
    .values({ caseId: c.id, token: randomBytes(24).toString('base64url'), expiresAt: new Date(Date.now() + 14 * 86400_000) })
    .returning()
  await audit(db, { caseId: c.id, actor: user, action: 'tautan_bukti', detail: 'Tautan bukti hanya baca dibuat (berlaku 14 hari)' })
  return link
}

export async function revokeShareLink(code: string, user: SessionUser) {
  const c = await loadCase(code)
  if (c.reporterId !== user.id) throw forbidden('Kasus ini bukan milik Anda.')
  const db = await getDb()
  await db.update(s.shareLinks).set({ revokedAt: new Date() }).where(and(eq(s.shareLinks.caseId, c.id), isNull(s.shareLinks.revokedAt)))
  await audit(db, { caseId: c.id, actor: user, action: 'tautan_bukti', detail: 'Tautan bukti dicabut' })
  return { ok: true }
}

/** Tampilan bukti bersama (C7): hanya baca, data pribadi disamarkan. */
export async function getSharedView(token: string) {
  const db = await getDb()
  const link = await db.query.shareLinks.findFirst({ where: eq(s.shareLinks.token, token) })
  if (!link) return { state: 'invalid' as const }
  if (link.revokedAt) return { state: 'revoked' as const }
  if (link.expiresAt.getTime() < Date.now()) return { state: 'expired' as const }
  const bundle = await getCaseBundle(link.caseId)
  const checks = await db.select().from(s.identityChecks).where(eq(s.identityChecks.shipmentId, bundle.shipment.id)).orderBy(asc(s.identityChecks.seq))
  const courier = await db
    .select()
    .from(s.evidence)
    .where(and(eq(s.evidence.shipmentId, bundle.shipment.id), eq(s.evidence.ownerType, 'courier'), isNull(s.evidence.deletedAt)))
  return { state: 'ok' as const, link, bundle, checks, courier }
}
