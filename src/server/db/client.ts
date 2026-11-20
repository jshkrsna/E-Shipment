import 'server-only'
import path from 'node:path'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export type DB = PostgresJsDatabase<typeof schema>

export class DatabaseConfigError extends Error {}

export function dbMode() {
  return process.env.DATABASE_URL ? 'postgres' : 'pglite'
}

type Holder = { db?: Promise<DB> }
const g = globalThis as unknown as { __eshipDb?: Holder }
const holder: Holder = (g.__eshipDb ??= {})

async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL
  if (url) {
    // node-postgres (bukan postgres.js): saat semua koneksi sibuk, query diantrekan, bukan
    // di-pipeline di satu koneksi. Pipelining membuat query menggantung di pooler mode
    // transaksi Supabase (port 6543), terutama pada halaman dengan banyak query paralel.
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
    const pool = new Pool({
      connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
      // Enkripsi wajib; sertifikat pooler Supabase tidak ada di trust store bawaan Node.
      ssl: local ? false : { rejectUnauthorized: false },
      max: process.env.VERCEL ? 5 : 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    })
    pool.on('error', (err) => console.error('[db] koneksi idle error', err.message))
    return drizzle(pool, { schema }) as unknown as DB
  }

  if (process.env.VERCEL) {
    // Disk Vercel read-only: database lokal (PGlite) tidak bisa dipakai di sini.
    throw new DatabaseConfigError('DATABASE_URL belum diisi di Environment Variables Vercel.')
  }

  // Mode lokal: PostgreSQL WASM (PGlite) di folder .data/pglite, migrasi & seed otomatis.
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const dataDir = path.join(process.cwd(), '.data', 'pglite')
  const { mkdirSync } = await import('node:fs')
  mkdirSync(dataDir, { recursive: true })
  const client = new PGlite(dataDir)
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
  const { seedIfEmpty } = await import('./seed')
  await seedIfEmpty(db as unknown as DB)
  return db as unknown as DB
}

export function getDb(): Promise<DB> {
  holder.db ??= createDb().catch((err) => {
    holder.db = undefined
    throw err
  })
  return holder.db
}

export { schema }
