import { desc, eq, ne } from 'drizzle-orm'
import { ScanForm } from '@/components/admin/scan-form'
import { Chip } from '@/components/ui'
import { getDb, schema as s } from '@/server/db/client'
import { dims, fmtShort, kg } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Pindai checkpoint' }

export default async function PindaiPage() {
  const db = await getDb()
  const recent = await db
    .select({ c: s.identityChecks, awb: s.shipments.awb })
    .from(s.identityChecks)
    .innerJoin(s.shipments, eq(s.shipments.id, s.identityChecks.shipmentId))
    .where(ne(s.identityChecks.result, 'reference'))
    .orderBy(desc(s.identityChecks.checkedAt), desc(s.identityChecks.id))
    .limit(12)
  const hubs = Array.from(new Set((await db.select({ hub: s.identityChecks.hub }).from(s.identityChecks)).map((h) => h.hub).filter((h) => h.startsWith('Hub'))))
  return (
    <Reveal>
      <WireMemo shape={{ rows: recent.length }} />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] leading-tight font-semibold md:text-[28px]">Pindai checkpoint</h1>
          <p className="max-w-[720px] text-mut">Catat hasil pindai paket di hub. Sistem membandingkan berat (toleransi 2%), ukuran, dan segel dengan catatan pengambilan, lalu memperbarui linimasa pelanggan dan antrean anomali secara otomatis.</p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <ScanForm hubs={hubs} />
          <section className="flex flex-col gap-3 rounded-p border border-line bg-white">
            <h2 className="px-5 pt-5 text-[17px] font-semibold">Pindai terbaru</h2>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[560px]">
                <thead><tr><th>Waktu</th><th>Resi</th><th>Hub</th><th>Berat, ukuran, segel</th><th>Hasil</th></tr></thead>
                <tbody>
                  {recent.map(({ c, awb }) => (
                    <tr key={c.id}>
                      <td className="font-mono text-[13px]">{c.checkedAt ? fmtShort(c.checkedAt) : '–'}</td>
                      <td className="font-mono">{awb}</td>
                      <td>{c.hub}</td>
                      <td className="text-[13px]">{c.result === 'not_scanned' ? '–' : `${kg(c.weightKg)}, ${dims(c.lengthCm, c.widthCm, c.heightCm)}, ${c.sealNo}`}</td>
                      <td>{c.result === 'match' ? <Chip tone="ok" icon="check">Cocok</Chip> : c.result === 'mismatch' ? <Chip tone="er" icon="x">{c.isFirstMismatch ? 'Pertama' : 'Tidak cocok'}</Chip> : <Chip tone="nu">Tidak dipindai</Chip>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Reveal>
  )
}
