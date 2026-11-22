/**
 * Buat ulang akun & data peraga (presentasi/dokumentasi) ke keadaan awal.
 *   Lokal    : npm run db:showcase        (hentikan `npm run dev` dulu; PGlite hanya satu proses)
 *   Produksi : npm run db:showcase:prod   (membaca .env.production.local)
 * Hanya data peraga (akun demo.*@eshipmennt.test dan resi JT9900000001xx…) yang dihapus/dibuat ulang.
 */
import path from 'node:path'
import fsp from 'node:fs/promises'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/server/db/schema'
import type { DB } from '../src/server/db/client'
import { SHOWCASE_ACCOUNTS, SHOWCASE_AWB, SHOWCASE_PASSWORD, resetShowcase } from '../src/server/db/showcase'
import { BULK_KIND_LABEL, type BulkKind, type BulkPackage } from '../src/server/db/showcase-packages'

async function removeFiles(keys: string[]) {
  if (!keys.length) return
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const { StorageClient } = await import('@supabase/storage-js')
    const headers: Record<string, string> = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
    const bucket = new StorageClient(`${url.replace(/\/$/, '')}/storage/v1`, headers).from(process.env.SUPABASE_BUCKET || 'evidence')
    const { error } = await bucket.remove(keys)
    if (error) console.warn('Peringatan: sebagian berkas peraga gagal dihapus dari Supabase:', error.message)
  } else {
    const root = path.join(process.cwd(), '.data', 'uploads')
    for (const k of keys) {
      const p = path.join(root, k)
      if (p.startsWith(root)) await fsp.rm(p, { force: true })
    }
  }
}

const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`
const phoneOf = (k: (typeof SHOWCASE_ACCOUNTS)[number]['key']) => SHOWCASE_ACCOUNTS.find((a) => a.key === k)!.phone.slice(-4)
const SCENARIO_ROWS = [
  { awb: SHOWCASE_AWB.belumKlaim, label: 'Belum diklaim: klaim dulu sebelum bisa melapor', owner: 'tanpa pemilik', last4: phoneOf('tidakbisa') },
  { awb: SHOWCASE_AWB.milikLain, label: 'Milik akun lain: tidak bisa diklaim/dilaporkan akun lain', owner: 'demo.baru', last4: phoneOf('baru') },
  { awb: SHOWCASE_AWB.baru, label: 'Kasus Baru', owner: 'demo.baru', last4: phoneOf('baru') },
  { awb: SHOWCASE_AWB.diproses, label: 'Kasus Diproses', owner: 'demo.diproses', last4: phoneOf('diproses') },
  { awb: SHOWCASE_AWB.penyebab, label: 'Kasus Penyebab ditemukan', owner: 'demo.penyebab', last4: phoneOf('penyebab') },
  { awb: SHOWCASE_AWB.selesai, label: 'Kasus Selesai', owner: 'demo.selesai', last4: phoneOf('selesai') },
]

/** Dokumen peraga (tanpa email/password admin agar aman di-commit). */
async function writeDoc(codes: Record<string, string | undefined>, bulk: BulkPackage[]) {
  const kinds = Object.keys(BULK_KIND_LABEL) as BulkKind[]
  const lines: string[] = [
    '# Data peraga (showcase)',
    '',
    'Dibuat oleh `npm run db:showcase` (lokal) atau `npm run db:showcase:prod` (produksi). Menjalankannya lagi mengembalikan semua data peraga ke keadaan awal; data lain tidak disentuh.',
    '',
    `Semua kasus peraga ditangani **satu akun admin** (\`ADMIN_EMAIL\`). Password semua akun peraga: \`${SHOWCASE_PASSWORD}\`.`,
    '',
    '## Akun pengguna',
    '',
    '| Email | Telepon (4 digit akhir) | Kasus | Keadaan |',
    '|---|---|---|---|',
    ...SHOWCASE_ACCOUNTS.map((a) => `| \`${a.email}\` | ${a.phone} (\`${a.phone.slice(-4)}\`) | ${codes[a.key] ?? '–'} | ${a.scenario} |`),
    '',
    '## Paket skenario',
    '',
    '| Resi | Untuk peraga | Pemilik | 4 digit telepon penerima |',
    '|---|---|---|---|',
    ...SCENARIO_ROWS.map((r) => `| \`${r.awb}\` | ${r.label} | ${r.owner} | \`${r.last4}\` |`),
    '',
    `Peraga "tidak bisa melapor" (masuk sebagai \`demo.tidakbisa\`): buka \`/lapor/${SHOWCASE_AWB.milikLain}\` (sudah milik akun lain, ditolak) dan \`/lapor/${SHOWCASE_AWB.belumKlaim}\` (harus diklaim dulu dengan 4 digit \`1101\`).`,
    '',
    '## 100 paket peraga',
    '',
    `Semua resi bisa dilacak siapa saja di \`/lacak/<resi>\`. Paket **milik pelapor** sudah dimiliki \`demo.pelapor@eshipmennt.test\` dan bisa langsung dilaporkan lewat \`/lapor/<resi>\`. Paket **tanpa pemilik** bisa diklaim akun mana pun (Pengguna) memakai 4 digit telepon penerima di tabel.`,
    '',
    '| Status | Jumlah | Milik pelapor | Tanpa pemilik |',
    '|---|---|---|---|',
    ...kinds.map((k) => {
      const all = bulk.filter((p) => p.kind === k)
      return `| ${BULK_KIND_LABEL[k]} | ${all.length} | ${all.filter((p) => p.owned).length} | ${all.filter((p) => !p.owned).length} |`
    }),
    `| **Total** | **${bulk.length}** | **${bulk.filter((p) => p.owned).length}** | **${bulk.filter((p) => !p.owned).length}** |`,
  ]
  for (const k of kinds) {
    const all = bulk.filter((p) => p.kind === k)
    if (!all.length) continue
    lines.push('', `### ${BULK_KIND_LABEL[k]} (${all.length})`, '', '| Resi | Rute | Nilai barang | Pemilik | 4 digit telepon penerima |', '|---|---|---|---|---|')
    for (const p of all) lines.push(`| \`${p.awb}\` | ${p.origin} → ${p.destination} | ${rupiah(p.itemValue)} | ${p.owned ? 'demo.pelapor' : `tanpa pemilik (${p.recipientName})`} | \`${p.recipientPhone.slice(-4)}\` |`)
  }
  const out = path.join(process.cwd(), 'docs', 'SHOWCASE.md')
  await fsp.mkdir(path.dirname(out), { recursive: true })
  await fsp.writeFile(out, lines.join('\n') + '\n', 'utf8')
  return out
}

async function main() {
  const url = process.env.DATABASE_URL
  let close: () => Promise<unknown>
  let db: DB
  if (url) {
    const client = postgres(url, { prepare: false, max: 1, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : 'require' })
    db = drizzlePg(client, { schema }) as unknown as DB
    close = () => client.end()
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    const { seedIfEmpty } = await import('../src/server/db/seed')
    const dataDir = path.join(process.cwd(), '.data', 'pglite')
    await fsp.mkdir(dataDir, { recursive: true })
    const client = new PGlite(dataDir)
    const pg = drizzle(client, { schema })
    await migrate(pg, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
    db = pg as unknown as DB
    await seedIfEmpty(db)
    close = () => client.close()
  }

  try {
    const r = await resetShowcase(db)
    await removeFiles(r.removedKeys)
    const codeOf: Record<string, string | undefined> = r.codes
    console.log(`\nData peraga siap. Semua kasus ditangani admin: ${r.admin.email}`)
    console.log(`Password semua akun peraga: ${SHOWCASE_PASSWORD}\n`)
    for (const a of SHOWCASE_ACCOUNTS) console.log(`  ${a.email.padEnd(32)} ${(codeOf[a.key] ?? '-').padEnd(8)} ${a.scenario}`)
    console.log(`\nResi peraga: belum diklaim ${SHOWCASE_AWB.belumKlaim} (klaim dengan 4 digit 1101), milik akun lain ${SHOWCASE_AWB.milikLain}`)
    const tally = new Map<string, number>()
    for (const p of r.bulk) tally.set(BULK_KIND_LABEL[p.kind], (tally.get(BULK_KIND_LABEL[p.kind]) ?? 0) + 1)
    console.log(`\n${r.bulk.length} paket peraga (${r.bulk.filter((p) => p.owned).length} milik demo.pelapor, ${r.bulk.filter((p) => !p.owned).length} tanpa pemilik):`)
    for (const [k, v] of tally) console.log(`  ${String(v).padStart(3)}  ${k}`)
    console.log(`\nDaftar lengkap resi: ${path.relative(process.cwd(), await writeDoc(codeOf, r.bulk))}`)
  } finally {
    await close()
  }
}

main().catch((e) => {
  console.error('Gagal membuat data peraga:', e?.cause?.message ?? e?.message ?? e)
  process.exit(1)
})
