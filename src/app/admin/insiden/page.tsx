import Link from 'next/link'
import { IncidentForm, type ClosedCase } from '@/components/admin/incident-form'
import { Chip } from '@/components/ui'
import { closedCasesWithoutIncident } from '@/server/services/admin'
import { listIncidents } from '@/server/services/incidents'
import { categoryLabel } from '@/lib/labels'
import { fmtDate } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'

export const metadata = { title: 'Insiden publik' }

export default async function InsidenAdmin() {
  const [incidents, closed] = await Promise.all([listIncidents(), closedCasesWithoutIncident()])
  const cases: ClosedCase[] = closed.map((c) => ({
    code: c.code,
    label: categoryLabel(c.category, null),
    cause: c.cause,
    days: c.closedAt ? Math.max(1, Math.round((c.closedAt.getTime() - c.createdAt.getTime()) / 86400_000)) : 1,
  }))
  return (
    <Reveal>
      <WireMemo shape={{ rows: incidents.length }} />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] leading-tight font-semibold md:text-[28px]">Insiden publik</h1>
            <p className="text-mut">Pengungkapan insiden yang tampil di halaman <Link className="lnk" href="/transparansi">Transparansi</Link>.</p>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <IncidentForm cases={cases} />
          <section className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold">Sudah dipublikasikan ({incidents.length})</h2>
            {incidents.map((i) => (
              <div key={i.id} className="flex flex-col gap-1.5 border-b border-line py-4 first:border-t">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-mut">{i.code}&ensp;{i.type}&ensp;{fmtDate(i.publishedAt)}</span>
                  <Chip tone={i.resolutionDays > 5 ? 'wn' : 'ok'}>{i.resolutionDays} hari</Chip>
                </div>
                <p className="font-semibold">{i.title}</p>
                <p className="text-[13px] text-mut">Penyebab: {i.cause}. Perbaikan: {i.fix}.</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </Reveal>
  )
}
