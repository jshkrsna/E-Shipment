import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { ClaimForm } from '@/components/claim-form'
import { Icon } from '@/components/icon'
import { ReportForm, type ReportEvidence } from '@/components/report-form'
import { Card } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { findShipment } from '@/server/services/shipments'
import { getDb, schema as s } from '@/server/db/client'

export const metadata = { title: 'Laporkan masalah' }

export default async function LaporPage({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const awb = decodeURIComponent(resi).toUpperCase()
  const user = await getCurrentUser()
  if (!user) redirect(`/masuk?next=/lapor/${awb}`)
  if (user.role === 'ADMIN') redirect('/admin/laporan')
  const shipment = await findShipment(awb)
  if (!shipment) notFound()
  const db = await getDb()

  const header = (
    <div className="flex items-center gap-2">
      <Link href={`/lacak/${awb}`} className="grid size-11 place-items-center rounded-r text-navy hover:bg-nu-bg" aria-label="Kembali ke pelacakan"><Icon name="back" size={22} /></Link>
      <div className="flex flex-col">
        <h1 className="text-[20px] font-extrabold md:text-[26px]">Laporkan masalah</h1>
        <span className="font-mono text-[12px] text-mut">{awb}</span>
      </div>
    </div>
  )

  if (shipment.ownerId !== user.id) {
    return (
      <div className="wx flex max-w-[640px] flex-col gap-5 py-6 lg:py-10">
        {header}
        <Card className="flex flex-col gap-3">
          <p className="font-semibold">Klaim paket ini sebagai penerima terlebih dahulu.</p>
          {shipment.ownerId ? <p className="text-mut">Paket ini sudah diklaim akun lain.</p> : <ClaimForm awb={awb} />}
        </Card>
      </div>
    )
  }

  const open = await db.query.cases.findFirst({ where: and(eq(s.cases.shipmentId, shipment.id), eq(s.cases.reporterId, user.id), ne(s.cases.status, 'SELESAI')) })
  if (open) redirect(`/kasus/${open.code}`)

  const ev = await db.select().from(s.evidence).where(and(eq(s.evidence.shipmentId, shipment.id), isNull(s.evidence.deletedAt)))
  const items: ReportEvidence[] = [
    ...ev.filter((e) => e.ownerType === 'user').map((e) => ({ id: e.id, label: e.fileName, owner: 'user' as const })),
    ...ev.filter((e) => e.ownerType === 'courier' && e.kind !== 'hub_scan').map((e) => ({ id: e.id, label: e.kind === 'handover' ? 'Bukti serah terima OTP' : 'Bukti pengambilan', owner: 'courier' as const })),
  ]

  return (
    <div className="wx grid max-w-[1100px] gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
      <div className="flex min-w-0 flex-col gap-5">
        {header}
        <ReportForm awb={awb} evidence={items} />
      </div>
      <aside className="hidden flex-col gap-3 lg:flex lg:pt-16">
        <Card className="flex flex-col gap-2">
          <span className="up">Paket</span>
          <p className="font-mono font-semibold">{awb}</p>
          <p className="text-[13px] text-mut">{shipment.origin} → {shipment.destination} · {shipment.status}</p>
          <Link className="lnk text-[13px]" href={`/lacak/${awb}/bukti`}>Tambah bukti di brankas</Link>
        </Card>
        <p className="note">Setelah dikirim, kasus muncul di panel admin ekspedisi dengan status Baru. Anda dapat memantau dan membalas di halaman kasus.</p>
      </aside>
    </div>
  )
}
