import { sql } from 'drizzle-orm'
import { route } from '@/server/http'
import { getDb } from '@/server/db/client'

/** Dipakai workflow keep-alive agar database gratis tidak dijeda karena tidak aktif. */
export const GET = route(async () => {
  const db = await getDb()
  await db.execute(sql`select 1`)
  return { ok: true, time: new Date().toISOString() }
})
