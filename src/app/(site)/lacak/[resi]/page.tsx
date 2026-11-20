import { notFound } from 'next/navigation'
import { Timeline } from '@/components/tracking'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'

export default async function LinimasaPage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const t = await getTrackingCached(decodeURIComponent(resi).toUpperCase(), await getCurrentUser())
  if (!t) notFound()
  return (
    <>
      <h2 className="sr-only">Linimasa</h2>
      <Timeline t={t} recipientLabel={t.shipment.recipientMasked} />
      <p className="note">Nomor resi sesuai laporan. Nama hub, jam, dan petugas adalah data ilustrasi.</p>
    </>
  )
}
