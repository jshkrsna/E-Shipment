/** Jalankan migrasi ke DATABASE_URL (produksi). Mode lokal (PGlite) bermigrasi otomatis saat server jalan. */
import path from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diisi. Untuk mode lokal tidak perlu migrasi manual.')
  process.exit(1)
}
const client = postgres(url, { prepare: false, max: 1 })
await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), 'drizzle') })
console.log('Migrasi selesai.')
await client.end()
