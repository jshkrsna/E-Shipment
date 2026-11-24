import { Chip, FilterChip } from '@/components/ui'
import { listIncidents } from '@/server/services/incidents'
import { INCIDENT_TYPES } from '@/lib/labels'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'
import { PendingBody, PendingScope } from '@/components/wire/pending'
import { TransparansiRowsWire } from '@/components/wire/site'

export const metadata = { title: 'Pengungkapan insiden' }

export default async function TransparansiPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const { jenis } = await searchParams
  const active = INCIDENT_TYPES.find((t) => t === jenis) ?? null
  const [rows, all] = await Promise.all([listIncidents(active), listIncidents()])
  const periods = Array.from(new Set(all.map((r) => r.period)))

  return (
    <Reveal>
      <WireMemo shape={{ rows: rows.length }} />
      <div className="wx flex flex-col gap-8 py-12 lg:py-16">
        <div className="flex max-w-[720px] flex-col gap-4">
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.025em] text-navy-d md:text-[42px]">Pengungkapan insiden</h1>
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-mut">Catatan publik insiden operasional setelah selesai ditangani: apa penyebabnya, berapa lama, dan apa yang diperbaiki. Tanpa data pribadi.</p>
        </div>

        <PendingScope>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter jenis insiden">
          <FilterChip href="/transparansi" on={!active}>Semua</FilterChip>
          {INCIDENT_TYPES.filter((t) => t !== 'Lainnya').map((t) => (
            <FilterChip key={t} href={`/transparansi?jenis=${encodeURIComponent(t)}`} on={active === t}>{t}</FilterChip>
          ))}
          <span className="grow" />
          <span className="text-[13px] text-mut">Periode {periods.join(', ') || '–'}</span>
        </div>

        {/* Desktop/tablet: tabel */}
        <PendingBody fallback={<TransparansiRowsWire />}>
        <div className="card hidden overflow-x-auto p-0 md:block">
          <table className="tbl min-w-[860px]">
            <thead>
              <tr><th>ID</th><th>Jenis insiden</th><th>Penyebab terkonfirmasi</th><th>Waktu penyelesaian</th><th>Perbaikan</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono">{r.code}</td>
                  <td className="font-semibold">{r.title}</td>
                  <td>{r.cause}</td>
                  <td><Chip tone={r.resolutionDays > 5 ? 'wn' : 'ok'} icon={r.resolutionDays > 5 ? 'clock' : 'check'}>{r.resolutionDays} hari</Chip></td>
                  <td>{r.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-6 text-center text-mut">Belum ada insiden untuk filter ini.</p>}
        </div>

        {/* Mobile: kartu */}
        <ul className="flex flex-col md:hidden">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 border-b border-line py-5 first:border-t">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] text-mut">{r.code}</span>
                <Chip tone={r.resolutionDays > 5 ? 'wn' : 'ok'} icon={r.resolutionDays > 5 ? 'clock' : 'check'}>{r.resolutionDays} hari</Chip>
              </div>
              <p className="font-semibold">{r.title}</p>
              <div className="kv">
                <span>Penyebab</span><span>{r.cause}</span>
                <span>Perbaikan</span><span>{r.fix}</span>
              </div>
            </li>
          ))}
          {!rows.length && <li className="py-6 text-mut">Belum ada insiden untuk filter ini.</li>}
        </ul>
        </PendingBody>
        </PendingScope>

        <p className="note">Setiap insiden dianonimkan sebelum dipublikasikan.</p>
      </div>
    </Reveal>
  )
}
