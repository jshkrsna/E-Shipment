import { notFound } from 'next/navigation'
import { IdentityCard, RouteSchematic } from '@/components/tracking'
import { Banner, Card } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'

export default async function RutePage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const t = await getTrackingCached(decodeURIComponent(resi).toUpperCase(), await getCurrentUser())
  if (!t) notFound()
  return (
    <>
      {t.firstMismatch && (
        <Banner tone="er" icon="flag">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Ketidakcocokan pertama: {t.firstMismatch.hub}</span>
            <p>Berat, ukuran, dan nomor segel paket berbeda dari catatan pengambilan. Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p>
          </div>
        </Banner>
      )}
      <Card className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">Rute rencana dan rute aktual</span>
          <span className="flex items-center gap-2 text-[12px] text-mut">
            <i className="inline-block w-4 border-t-2 border-dashed border-line-d" />Rencana
            <i className="inline-block w-4 border-t-[3px] border-navy" />Aktual
          </span>
        </div>
        <RouteSchematic checks={t.checks} />
        <p className="hint">Peta skematis, bukan skala. Hub dan jalur adalah ilustrasi.</p>
      </Card>
      <h2 className="text-[16px] font-bold">Pemeriksaan identitas di setiap hub</h2>
      <div className="grid gap-3 xl:grid-cols-2">
        {t.checks.map((c) => <IdentityCard key={c.id} c={c} reference={t.reference} />)}
      </div>
      <p className="note">Nama hub dan nilai ukur adalah data ilustrasi.</p>
    </>
  )
}
