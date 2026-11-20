import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { getDb, schema as s } from '../db/client'

export async function listIncidents(type?: string | null) {
  const db = await getDb()
  const q = db.select().from(s.incidents)
  const rows = type ? await q.where(eq(s.incidents.type, type)).orderBy(desc(s.incidents.publishedAt)) : await q.orderBy(desc(s.incidents.publishedAt))
  return rows
}
