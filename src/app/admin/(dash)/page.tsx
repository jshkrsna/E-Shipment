import Link from 'next/link'
import { Chip, FilterChip, LinkButton } from '@/components/ui'
import { getDashboard } from '@/server/services/admin'
import { fmtDateTime, fmtShort, remainingShort } from '@/lib/format'
import { Reveal } from '@/components/reveal'
import { WireMemo } from '@/components/wire/memo'
import { PendingBody, PendingScope } from '@/components/wire/pending'
import { AdminQueueWire } from '@/components/wire/admin'

export const metadata = { title: 'Dasbor & antrean anomali' }

const FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'mismatch', label: 'Tidak cocok' },
  { key: 'stuck', label: 'Macet' },
  { key: 'no_proof', label: 'Diterima tanpa bukti' },
] as const

const CATEGORY_CARDS = [
  { key: 'TERTUKAR', label: 'Barang tertukar', note: 'Isi paket tidak sesuai pesanan' },
  { key: 'RUSAK', label: 'Barang rusak', note: 'Kemasan atau isi rusak' },
  { key: 'TIDAK_DITERIMA', label: 'Barang hilang', note: 'Paket tidak diterima penerima' },
] as const

const CASE_STATUSES = [
  { key: 'baru', label: 'Baru', dot: 'bg-wn' },
  { key: 'diproses', label: 'Diproses', dot: 'bg-nb' },
  { key: 'selesai', label: 'Selesai', dot: 'bg-ok' },
] as const

export default async function Dasbor({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams
  const filter = (FILTERS.find((x) => x.key === f)?.key ?? 'semua') as (typeof FILTERS)[number]['key']
  const d = await getDashboard(filter)
  const kpis = [
    { label: 'Paket aktif', value: d.kpi.active, note: 'Sedang dalam perjalanan', color: '' },
    { label: 'Berisiko', value: d.kpi.atRisk, note: 'Estimasi terlampaui', color: 'text-wn' },
    { label: 'Macet', value: d.kpi.stuck, note: 'Tanpa pindai lebih dari 12 jam', color: 'text-wn' },
    { label: 'Tidak cocok', value: d.kpi.mismatch, note: 'Identitas paket berbeda', color: 'text-er' },
    { label: 'Kasus mendekati batas', value: d.kpi.nearDeadline, note: 'Sisa waktu kurang dari 6 jam', color: '' },
  ]
  return (
    <Reveal>
      <WireMemo shape={{ queue: d.queue.length, other: d.otherCases ? 1 : 0 }} />
      <WireMemo scope="/admin" shape={Object.fromEntries(FILTERS.map((x) => [`c_${x.key}`, d.counts[x.key]]))} />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[24px] leading-tight font-semibold md:text-[28px]">Dasbor dan antrean anomali</h1>
            <span className="text-mut">Data yang sama dengan yang dilihat konsumen. Diperbarui <span className="num">{fmtDateTime(new Date())}</span>.</span>
          </div>
        </div>

        <section className="grid grid-cols-2 overflow-hidden rounded-p border border-line bg-white md:grid-cols-3 xl:grid-cols-5" aria-label="Ringkasan">
          {kpis.map((k) => (
            <div key={k.label} className="-mt-px -ml-px flex flex-col gap-1.5 border-t border-l border-line p-5">
              <span className="text-[13px] font-medium text-nu">{k.label}</span>
              <b className={`num text-[30px] leading-none font-semibold tracking-[-0.02em] md:text-[34px] ${k.color || 'text-navy-d'}`}>{k.value.toLocaleString('id-ID')}</b>
              <span className="text-[13px] text-mut">{k.note}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col rounded-p border border-line bg-white" aria-labelledby="per-jenis">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-4">
            <h2 id="per-jenis" className="text-[17px] font-semibold">Laporan per jenis masalah</h2>
            <span className="text-[13px] text-mut">Semua laporan dari penerima{d.otherCases ? `, ${d.otherCases.toLocaleString('id-ID')} laporan jenis lain tidak ditampilkan` : ''}.</span>
          </div>
          <div className="grid border-t border-line md:grid-cols-3">
            {CATEGORY_CARDS.map((k) => {
              const c = d.categories[k.key]
              return (
                <div key={k.key} className="-mt-px flex flex-col gap-4 border-t border-line p-5 md:mt-0 md:border-t-0 md:border-l md:first:border-l-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{k.label}</span>
                      <span className="text-[13px] text-mut">{k.note}</span>
                    </div>
                    <b className="num text-[30px] leading-none font-semibold tracking-[-0.02em] text-navy-d">{c.total.toLocaleString('id-ID')}</b>
                  </div>
                  <ul className="flex flex-col text-[14px]">
                    {CASE_STATUSES.map((st) => (
                      <li key={st.key}>
                        <Link href={`/admin/laporan?jenis=${k.key}&status=${st.key}`} className="flex min-h-10 items-center justify-between gap-2 border-t border-line hover:text-navy">
                          <span className="flex items-center gap-2"><span aria-hidden className={`size-2 rounded-full ${st.dot}`} />{st.label}</span>
                          <span className="num font-semibold">{c[st.key].toLocaleString('id-ID')}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <LinkButton size="sm" variant="secondary" className="self-start" href={`/admin/laporan?jenis=${k.key}`}>Lihat laporan</LinkButton>
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-p border border-line bg-white">
          <PendingScope>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <h2 className="text-[17px] font-semibold">Antrean anomali</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
              {FILTERS.map((x) => (
                <FilterChip key={x.key} href={x.key === 'semua' ? '/admin' : `/admin?f=${x.key}`} on={filter === x.key}>{x.label} ({d.counts[x.key]})</FilterChip>
              ))}
            </div>
          </div>

          <PendingBody fallback={<AdminQueueWire />}>
          <div className="hidden overflow-x-auto md:block">
            <table className="tbl">
              <thead><tr><th>Tingkat</th><th>Resi</th><th>Jenis</th><th>Hub</th><th>Terdeteksi</th><th>Penugasan</th><th>Batas waktu</th><th><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody>
                {d.queue.map((a, i) => {
                  const rem = remainingShort(a.deadline)
                  const urgent = new Date(a.deadline).getTime() - Date.now() < 36 * 3600_000
                  return (
                    <tr key={a.id} className={i === 0 ? 'bg-nb-bg/40' : ''}>
                      <td>{a.severity === 'tinggi' ? <Chip tone="er" icon="alert">Tinggi</Chip> : <Chip tone="wn" icon="clock">Sedang</Chip>}</td>
                      <td className={`font-mono ${i === 0 ? 'font-semibold' : ''}`}><Link className="hover:underline" href={`/lacak/${a.awb}`}>{a.awb}</Link></td>
                      <td>{a.label}</td>
                      <td>{a.hub}</td>
                      <td>{fmtShort(a.detectedAt)}</td>
                      <td>{a.assignee ?? 'Belum ditugaskan'}</td>
                      <td><Chip tone={urgent ? 'wn' : 'nu'}>{rem}</Chip></td>
                      <td>
                        {a.caseCode ? (
                          <LinkButton size="sm" variant={i === 0 ? 'primary' : 'secondary'} href={`/admin/laporan/${a.caseCode}?tab=investigasi`}>{i === 0 ? 'Buka kasus' : 'Buka'}</LinkButton>
                        ) : (
                          <LinkButton size="sm" variant="secondary" href={`/lacak/${a.awb}`}>Lihat paket</LinkButton>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col border-t border-line md:hidden">
            {d.queue.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 border-b border-line px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  {a.severity === 'tinggi' ? <Chip tone="er" icon="alert">Tinggi</Chip> : <Chip tone="wn" icon="clock">Sedang</Chip>}
                  <Chip tone="nu">{remainingShort(a.deadline)}</Chip>
                </div>
                <p className="font-mono font-semibold">{a.awb}</p>
                <p className="text-[14px]">{a.label}, {a.hub}</p>
                <p className="text-[13px] text-mut">Terdeteksi {fmtShort(a.detectedAt)}. {a.assignee ?? 'Belum ditugaskan'}.</p>
                <LinkButton size="sm" variant="secondary" className="self-start" href={a.caseCode ? `/admin/laporan/${a.caseCode}?tab=investigasi` : `/lacak/${a.awb}`}>{a.caseCode ? `Buka kasus ${a.caseCode}` : 'Lihat paket'}</LinkButton>
              </li>
            ))}
          </ul>
          {d.queue.length === 0 && <p className="px-5 text-mut">Tidak ada anomali terbuka.</p>}
          </PendingBody>
          </PendingScope>
          <p className="note mx-5 mb-5">Anomali dibuat otomatis dari pemindaian hub (lihat Pindai checkpoint).</p>
        </section>
      </div>
    </Reveal>
  )
}
