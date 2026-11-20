import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Icon } from '@/components/icon'
import { Chip, EmptyState, LinkButton } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'
import { listMyCases } from '@/server/services/cases'
import { categoryLabel, USER_STEPS, userStepIndex } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'

export const metadata = { title: 'Kasus saya' }

export default async function KasusSaya() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/kasus')
  if (user.role === 'ADMIN') redirect('/admin/laporan')
  const cases = await listMyCases(user)
  return (
    <div className="wx flex max-w-[860px] flex-col gap-6 py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="up">Akun {user.name}</span>
          <h1 className="text-[26px] font-extrabold md:text-[32px]">Kasus saya</h1>
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
                <Link href={`/kasus/${c.code}`} className="card flex items-center gap-3 hover:shadow-md">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-nb-bg text-navy"><Icon name="doc" size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold"><span className="font-mono">{c.code}</span> · {categoryLabel(c.category, c.categoryOther)}</p>
                    <p className="text-[12px] text-mut"><span className="font-mono">{c.awb}</span> · dibuka {fmtDateTime(c.createdAt)}</p>
                  </div>
                  <Chip tone={c.status === 'SELESAI' ? 'ok' : c.status === 'BARU' ? 'nb' : 'wn'}>{USER_STEPS[step]}</Chip>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
