import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { DatabaseConfigError, dbMode, getDb, schema as s } from '@/server/db/client'
import { storageDriverName, supabaseConfigured } from '@/server/storage'

/** Kode error Postgres / jaringan → penjelasan aman (tanpa membocorkan kredensial). */
function explain(err: unknown): string {
  if (err instanceof DatabaseConfigError) return err.message
  const e = (err as { cause?: unknown })?.cause ?? err
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    '42P01': 'Tabel belum ada: jalankan migrasi (npm run db:migrate) ke DATABASE_URL produksi.',
    '28P01': 'Login database gagal: periksa password di DATABASE_URL.',
    '3D000': 'Nama database di DATABASE_URL tidak ditemukan.',
    ENOTFOUND: 'Host database tidak ditemukan: periksa host di DATABASE_URL.',
    ECONNREFUSED: 'Koneksi database ditolak: periksa host/port di DATABASE_URL.',
    ETIMEDOUT: 'Koneksi database timeout: pakai connection string "Transaction pooler" (port 6543).',
    CONNECT_TIMEOUT: 'Koneksi database timeout: pakai connection string "Transaction pooler" (port 6543).',
    XX000: 'Ditolak pooler: periksa format user (postgres.<project-ref>) di DATABASE_URL.',
  }
  return map[code] ?? `Gagal terhubung ke database${code ? ` (kode ${code})` : ''}.`
}

function storageWarning() {
  const driver = storageDriverName()
  if (driver === 'unconfigured') return 'Unggah bukti tidak akan berfungsi: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY tidak terbaca di deployment ini. Isi di Vercel (environment Production) lalu Redeploy.'
  if (driver === 'supabase' && !supabaseConfigured()) return 'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi.'
  return null
}

/** Status kesehatan; dipakai workflow keep-alive dan untuk diagnosa deploy. Tidak memuat nilai rahasia. */
export async function GET() {
  const base = {
    db: dbMode(),
    storage: storageDriverName(),
    storageWarning: storageWarning(),
    env: {
      STORAGE_DRIVER: process.env.STORAGE_DRIVER || null,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
    },
    deployment: process.env.VERCEL
      ? { env: process.env.VERCEL_ENV ?? null, region: process.env.VERCEL_REGION ?? null, commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null }
      : null,
    time: new Date().toISOString(),
  }
  try {
    const db = await getDb()
    await db.execute(sql`select 1`)
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.users)
    const seeded = Number(n) > 0
    return NextResponse.json({ ok: seeded, ...base, seeded, ...(seeded ? {} : { error: 'Database kosong: jalankan npm run db:seed ke DATABASE_URL produksi.' }) }, { status: seeded ? 200 : 503 })
  } catch (err) {
    console.error('[health]', err)
    return NextResponse.json({ ok: false, ...base, error: explain(err) }, { status: 503 })
  }
}
