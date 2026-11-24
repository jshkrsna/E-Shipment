import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Icon } from '@/components/icon'
import { Chip, EmptyState, LinkButton } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { listMyCases } from '@/server/services/cases'
import { categoryLabel, USER_STEPS, userStepIndex } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Kasus saya' }

export default async function KasusSaya() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/kasus')
  if (user.role === 'ADMIN') redirect('/admin/laporan')
  const cases = await listMyCases(user)
  return (
    <Reveal>
      <WireMemo shape={{ cases: cases.length }} />
      <div className="wx flex max-w-[860px] flex-col gap-6 py-10 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.025em] text-navy-d md:text-[40px]">Kasus saya</h1>
          </div>
          <LinkButton href="/lapor" icon="flag">Laporkan masalah</LinkButton>
        </div>
        {cases.length === 0 ? (
          <EmptyState icon="doc" title="Belum ada kasus">Laporan yang Anda kirim akan muncul di sini beserta status dan percakapannya.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {cases.map((c) => {
              const step = userStepIndex(c.status)
              return (
                <li key={c.code}>
                  <Link href={`/kasus/${c.code}`} className="flex items-center gap-4 rounded-p border border-line bg-white px-5 py-4 transition-colors hover:border-navy/40">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-navy"><Icon name="doc" size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold"><span className="font-mono font-medium">{c.code}</span><span className="ml-2.5 font-normal text-mut">{categoryLabel(c.category, c.categoryOther)}</span></p>
                      <p className="text-[13px] text-mut"><span className="font-mono">{c.awb}</span>, dibuka <span className="num">{fmtDateTime(c.createdAt)}</span></p>
                    </div>
                    <Chip tone={c.status === 'SELESAI' ? 'ok' : c.status === 'BARU' ? 'nb' : 'wn'}>{USER_STEPS[step]}</Chip>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Reveal>
  )
}
