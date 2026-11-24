import { notFound } from 'next/navigation'
import type { ShipmentEvent } from '@/server/db/schema'
import { Timeline } from '@/components/tracking'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

/** Jumlah baris teks tiap butir linimasa (mengikuti EventBody) untuk wireframe. */
function lineCounts(events: ShipmentEvent[]) {
  return Object.fromEntries(
    events.slice(0, 12).map((e, k) => [
      `l${k}`,
      e.kind === 'no_scan' ? 2 : e.kind === 'hub_scan' ? (e.identityResult === 'match' || e.identityResult === 'mismatch' ? 3 : 2) : e.actor || e.method ? 3 : 2,
    ]),
  )
}

export default async function LinimasaPage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const t = await getTrackingCached(decodeURIComponent(resi).toUpperCase(), await getCurrentUser())
  if (!t) notFound()
  return (
    <Reveal>
      <WireMemo scope={`/lacak/${t.shipment.awb}`} shape={{ events: t.events.length, bad: t.events.findIndex((e) => e.kind === 'hub_scan' && e.isFirstMismatch), gap: t.events.findIndex((e) => e.kind === 'no_scan'), ...lineCounts(t.events) }} />
      <>
        <h2 className="sr-only">Linimasa</h2>
        <Timeline t={t} recipientLabel={t.shipment.recipientMasked} />
      </>
    </Reveal>
  )
}
