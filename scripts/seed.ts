/** Isi data contoh ke DATABASE_URL bila masih kosong. */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../src/server/db/schema'
import { seedIfEmpty } from '../src/server/db/seed'
import type { DB } from '../src/server/db/client'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diisi. Mode lokal mengisi data contoh otomatis.')
  process.exit(1)
}
const client = postgres(url, { prepare: false, max: 1 })
const done = await seedIfEmpty(drizzle(client, { schema }) as unknown as DB)
console.log(done ? 'Data contoh dimasukkan.' : 'Database sudah berisi data, seed dilewati.')
await client.end()
