import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { Icon } from '@/components/icon'
import { TrackForm } from '@/components/track-form'
import { Card, Chip, EmptyState } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getDb, schema as s } from '@/server/db/client'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Laporkan masalah' }

export default async function LaporIndex() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/lapor')
  if (user.role === 'ADMIN') redirect('/admin/laporan')
  const db = await getDb()
  const shipments = await db.select().from(s.shipments).where(eq(s.shipments.ownerId, user.id)).orderBy(desc(s.shipments.statusAt))
  const open = await db.select({ code: s.cases.code, shipmentId: s.cases.shipmentId, status: s.cases.status }).from(s.cases).where(and(eq(s.cases.reporterId, user.id)))
  return (
    <Reveal>
      <WireMemo shape={{ shipments: shipments.length }} />
      <div className="wx flex max-w-[760px] flex-col gap-6 py-10 lg:py-16">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.025em] text-navy-d md:text-[40px]">Paket mana yang bermasalah?</h1>
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
                  <Link href={c ? `/kasus/${c.code}` : `/lapor/${sh.awb}`} className="flex items-center gap-4 rounded-p border border-line bg-white px-5 py-4 transition-colors hover:border-navy/40">
                    <span className="grid size-10 place-items-center rounded-full bg-nb-bg text-navy"><Icon name="box" size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-semibold">{sh.awb}</p>
                      <p className="text-[13px] text-mut">{sh.origin} ke {sh.destination}, {sh.status.toLowerCase()}</p>
                    </div>
                    {c ? <Chip tone="wn" icon="clock">Kasus {c.code}</Chip> : <Chip tone="nb" icon="flag">Laporkan</Chip>}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <Card className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">Paket lain</h2>
          <TrackForm multiline={false} />
        </Card>
      </div>
    </Reveal>
  )
}
