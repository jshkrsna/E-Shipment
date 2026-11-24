import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TrackForm } from '@/components/track-form'
import { Banner, Chip } from '@/components/ui'
import { Icon } from '@/components/icon'
import { getShipmentSummaries, parseAwbs } from '@/server/services/shipments'
import { fmtDateTime } from '@/lib/format'
import { Reveal } from '@/components/reveal'

export const metadata = { title: 'Lacak paket' }

export default async function LacakPage({ searchParams }: { searchParams: Promise<{ resi?: string }> }) {
  const { resi = '' } = await searchParams
  const awbs = parseAwbs(resi)
  if (awbs.length === 1) redirect(`/lacak/${awbs[0]}`)
  const found = await getShipmentSummaries(awbs)
  const missing = awbs.filter((a) => !found.some((f) => f.awb === a))

  return (
    <Reveal>
      <div className="wx flex max-w-[760px] flex-col gap-6 py-10 lg:py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.025em] text-navy-d md:text-[40px]">Lacak paket dengan bukti</h1>
          <p className="text-mut">Masukkan satu atau beberapa nomor resi. Coba <Link className="lnk" href="/lacak/JT110461625999">JT110461625999</Link> atau <Link className="lnk" href="/lacak/JT110461625100">JT110461625100</Link>.</p>
        </div>
        <TrackForm initial={awbs.join('\n')} />
        {awbs.length > 1 && (
          <section className="flex flex-col gap-2" aria-label="Hasil">
            <h2 className="text-[17px] font-semibold">{found.length} dari {awbs.length} resi ditemukan</h2>
            {found.map((s) => (
              <Link key={s.id} href={`/lacak/${s.awb}`} className="flex items-center gap-4 rounded-p border border-line bg-white px-5 py-4 transition-colors hover:border-navy/40">
                <span className="grid size-10 place-items-center rounded-full bg-nb-bg text-navy"><Icon name="box" size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-semibold">{s.awb}</p>
                  <p className="text-[13px] text-mut">{s.origin} ke {s.destination}{s.statusAt ? `, ${fmtDateTime(s.statusAt)}` : ''}</p>
                </div>
                <Chip tone={s.status === 'Diterima' ? 'ok' : 'nb'}>{s.status}</Chip>
                <Icon name="right" size={18} className="text-mut" />
              </Link>
            ))}
            {missing.length > 0 && (
              <Banner tone="wn" icon="alert"><p className="text-[13px]">Tidak ditemukan: <span className="font-mono">{missing.join(', ')}</span>. Periksa kembali nomor resi.</p></Banner>
            )}
          </section>
        )}
      </div>
    </Reveal>
  )
}
