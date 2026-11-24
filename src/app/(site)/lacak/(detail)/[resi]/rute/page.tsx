import { notFound } from 'next/navigation'
import { IdentityCard, RouteSchematic } from '@/components/tracking'
import { Banner } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export default async function RutePage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const t = await getTrackingCached(decodeURIComponent(resi).toUpperCase(), await getCurrentUser())
  if (!t) notFound()
  return (
    <Reveal>
      <WireMemo scope={`/lacak/${t.shipment.awb}/rute`} shape={{ nodes: t.checks.filter((c) => c.result !== 'reference').length, checks: t.checks.length, banner: t.firstMismatch ? 1 : 0, bad: t.checks.filter((c) => c.result !== 'reference').findIndex((c) => c.result === 'mismatch'), gapCard: t.checks.at(-1)?.result === 'not_scanned' ? 1 : 0 }} />
      <>
        {t.firstMismatch && (
          <Banner tone="er" icon="flag">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Ketidakcocokan pertama: {t.firstMismatch.hub}</span>
              <p>Berat, ukuran, dan nomor segel paket berbeda dari catatan pengambilan. Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p>
            </div>
          </Banner>
        )}
        <div className="flex flex-col gap-3 border-b border-line pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[17px] font-semibold">Rute rencana dan rute aktual</h2>
            <span className="flex items-center gap-2 text-[13px] text-mut">
              <i className="inline-block w-5 border-t border-dashed border-line-d" />Rencana
              <i className="ml-3 inline-block w-5 border-t-2 border-navy" />Aktual
            </span>
          </div>
          <RouteSchematic checks={t.checks} />
          <p className="hint">Peta skematis, bukan skala.</p>
        </div>
        <h2 className="text-[17px] font-semibold">Pemeriksaan identitas di setiap hub</h2>
        <div className="grid gap-3 xl:grid-cols-2">
          {t.checks.map((c) => <IdentityCard key={c.id} c={c} reference={t.reference} />)}
        </div>
      </>
    </Reveal>
  )
}
