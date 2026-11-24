import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/icon'
import { Reveal } from '@/components/reveal'
import { MismatchBanner, StatusCard } from '@/components/tracking'
import { TrackForm } from '@/components/track-form'
import { TrackTabs } from '@/components/track-tabs'
import { LinkButton, btnClass } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { getTrackingCached } from '@/server/services/shipments'
import { WireMemo } from '@/components/wire/memo'

export async function generateMetadata({ params }: { params: Promise<{ resi: string }> }) {
  const { resi } = await params
  return { title: `Lacak ${decodeURIComponent(resi).toUpperCase()}` }
}

export default async function TrackLayout({ children, params }: { children: React.ReactNode; params: Promise<{ resi: string }> }) {
  const { resi } = await params
  const awb = decodeURIComponent(resi).toUpperCase()
  const user = await getCurrentUser()
  const t = await getTrackingCached(awb, user)
  if (!t) notFound()

  const reportHref = t.openCase ? `/kasus/${t.openCase.code}` : `/lapor/${awb}`
  const reportLabel = t.openCase ? `Lihat kasus ${t.openCase.code}` : 'Laporkan masalah'

  return (
    <Reveal>
      <WireMemo scope={`/lacak/${awb}`} shape={{ alert: t.firstMismatch ? 1 : 0, chips: (t.firstMismatch ? 1 : 0) + (t.underInvestigation ? 1 : 0), bar: user?.role !== 'ADMIN' ? 1 : 0 }} />
      <div className="pb-24 lg:pb-16">
        <div className="wx flex flex-col gap-6 pt-5 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-10 lg:pt-10">
          {/* Kolom ringkasan */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-1">
              <Link href="/lacak" className="-ml-2.5 grid size-11 shrink-0 place-items-center rounded-r text-navy" aria-label="Lacak resi lain">
                <Icon name="back" size={20} />
              </Link>
              <div className="min-w-0 flex-1"><TrackForm initial={awb} compact /></div>
            </div>
            <StatusCard t={t} />
            <MismatchBanner t={t} />
            {!user?.role || user.role === 'PENGGUNA' ? (
              <div className="hidden gap-2 lg:flex">
                <LinkButton href={reportHref} icon="flag" className="grow">{reportLabel}</LinkButton>
                {t.openCase && t.isOwner && (
                  <LinkButton href={`/kasus/${t.openCase.code}#bagikan`} variant="secondary" className="w-11 px-0" aria-label="Bagikan bukti"><Icon name="link" size={18} /></LinkButton>
                )}
              </div>
            ) : (
              t.cases[0] && <LinkButton href={`/admin/laporan/${t.cases[0].code}`} variant="secondary" icon="grid" className="hidden lg:inline-flex">Buka di panel admin</LinkButton>
            )}
          </aside>

          {/* Konten tab */}
          <section className="-mx-4 min-w-0 border-y border-line bg-white md:mx-0 md:rounded-p md:border">
            <TrackTabs awb={awb} />
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</div>
          </section>
        </div>

        {/* Bar aksi lengket (mobile) */}
        {user?.role !== 'ADMIN' && (
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
            <Link href={reportHref} className={btnClass('primary', 'grow')}><Icon name="flag" size={17} />{reportLabel}</Link>
            {t.openCase && t.isOwner && (
              <Link href={`/kasus/${t.openCase.code}#bagikan`} className={btnClass('secondary', 'w-11 px-0')} aria-label="Bagikan bukti"><Icon name="link" size={18} /></Link>
            )}
          </div>
        )}
      </div>
    </Reveal>
  )
}
