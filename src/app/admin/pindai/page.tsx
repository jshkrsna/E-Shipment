import { desc, eq, ne } from 'drizzle-orm'
import { ScanForm } from '@/components/admin/scan-form'
import { Chip } from '@/components/ui'
import { getDb, schema as s } from '@/server/db/client'
import { dims, fmtShort, kg } from '@/lib/format'

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
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-extrabold md:text-[24px]">Pindai checkpoint</h1>
        <p className="max-w-[720px] text-mut">Catat hasil pindai paket di hub. Sistem membandingkan berat (toleransi 2%), ukuran, dan segel dengan catatan pengambilan, lalu memperbarui linimasa pelanggan dan antrean anomali secara otomatis.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <ScanForm hubs={hubs} />
        <section className="card flex flex-col gap-3 p-0">
          <h2 className="px-4 pt-4 text-[16px] font-bold">Pindai terbaru</h2>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[560px]">
              <thead><tr><th>Waktu</th><th>Resi</th><th>Hub</th><th>Berat · ukuran · segel</th><th>Hasil</th></tr></thead>
              <tbody>
                {recent.map(({ c, awb }) => (
                  <tr key={c.id}>
                    <td className="font-mono text-[12px]">{c.checkedAt ? fmtShort(c.checkedAt) : '–'}</td>
                    <td className="font-mono">{awb}</td>
                    <td>{c.hub}</td>
                    <td className="text-[12px]">{c.result === 'not_scanned' ? '–' : `${kg(c.weightKg)} · ${dims(c.lengthCm, c.widthCm, c.heightCm)} · ${c.sealNo}`}</td>
                    <td>{c.result === 'match' ? <Chip tone="ok" icon="check">Cocok</Chip> : c.result === 'mismatch' ? <Chip tone="er" icon="x">{c.isFirstMismatch ? 'Pertama' : 'Tidak cocok'}</Chip> : <Chip tone="nu">Tidak dipindai</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
