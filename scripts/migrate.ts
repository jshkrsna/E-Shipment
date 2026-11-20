/** Jalankan migrasi ke DATABASE_URL (produksi). Mode lokal (PGlite) bermigrasi otomatis saat server jalan. */
import path from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL belum diisi. Untuk mode lokal tidak perlu migrasi manual.')
    process.exit(1)
  }
  const client = postgres(url, { prepare: false, max: 1, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : 'require', onnotice: () => {} })
  try {
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), 'drizzle') })
    console.log('Migrasi selesai.')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Migrasi gagal:', e?.cause?.message ?? e?.message ?? e)
  process.exit(1)
})
