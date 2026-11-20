import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { Icon } from '@/components/icon'
import { TrackForm } from '@/components/track-form'
import { Card, Chip, EmptyState } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getDb, schema as s } from '@/server/db/client'

export const metadata = { title: 'Laporkan masalah' }

export default async function LaporIndex() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/lapor')
  if (user.role === 'ADMIN') redirect('/admin/laporan')
  const db = await getDb()
  const shipments = await db.select().from(s.shipments).where(eq(s.shipments.ownerId, user.id)).orderBy(desc(s.shipments.statusAt))
  const open = await db.select({ code: s.cases.code, shipmentId: s.cases.shipmentId, status: s.cases.status }).from(s.cases).where(and(eq(s.cases.reporterId, user.id)))
  return (
    <div className="wx flex max-w-[760px] flex-col gap-6 py-8 lg:py-12">
      <div className="flex flex-col gap-1">
        <span className="up">Laporkan masalah</span>
        <h1 className="text-[26px] font-extrabold md:text-[32px]">Paket mana yang bermasalah?</h1>
        <p className="text-mut">Pilih paket milik Anda. Paket baru dapat diklaim lewat nomor resi dan 4 digit akhir telepon penerima.</p>
      </div>
      {shipments.length === 0 ? (
        <EmptyState icon="box" title="Belum ada paket di akun Anda">Lacak nomor resi Anda di bawah, lalu klaim paket di tab Bukti.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {shipments.map((sh) => {
            const c = open.find((o) => o.shipmentId === sh.id && o.status !== 'SELESAI')
            return (
              <li key={sh.id}>
                <Link href={c ? `/kasus/${c.code}` : `/lapor/${sh.awb}`} className="card flex items-center gap-3 hover:shadow-md">
                  <span className="grid size-10 place-items-center rounded-full bg-nb-bg text-navy"><Icon name="box" size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-semibold">{sh.awb}</p>
                    <p className="text-[12px] text-mut">{sh.origin} → {sh.destination} · {sh.status}</p>
                  </div>
                  {c ? <Chip tone="wn" icon="clock">Kasus {c.code}</Chip> : <Chip tone="nb" icon="flag">Laporkan</Chip>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <Card className="flex flex-col gap-3">
        <h2 className="text-[16px] font-bold">Paket lain</h2>
        <TrackForm multiline={false} />
      </Card>
    </div>
  )
}
