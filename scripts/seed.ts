/** Isi data contoh ke DATABASE_URL bila masih kosong. Akun admin memakai ADMIN_EMAIL / ADMIN_PASSWORD. */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../src/server/db/schema'
import { seedIfEmpty } from '../src/server/db/seed'
import type { DB } from '../src/server/db/client'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL belum diisi. Mode lokal mengisi data contoh otomatis.')
    process.exit(1)
  }
  const client = postgres(url, { prepare: false, max: 1, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : 'require' })
  try {
    const done = await seedIfEmpty(drizzle(client, { schema }) as unknown as DB)
    console.log(done ? `Data contoh dimasukkan. Admin: ${process.env.ADMIN_EMAIL || 'admin@eshipmennt.test'}` : 'Database sudah berisi data, seed dilewati.')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Seed gagal:', e?.cause?.message ?? e?.message ?? e)
  process.exit(1)
})
