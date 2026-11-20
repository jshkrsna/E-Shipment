import 'server-only'
import path from 'node:path'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export type DB = PostgresJsDatabase<typeof schema>

type Holder = { db?: Promise<DB> }
const g = globalThis as unknown as { __eshipDb?: Holder }
const holder: Holder = (g.__eshipDb ??= {})

async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    // prepare:false agar kompatibel dengan connection pooler (Supabase/Neon, mode transaction).
    const client = postgres(url, { prepare: false, max: 5 })
    return drizzle(client, { schema })
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
