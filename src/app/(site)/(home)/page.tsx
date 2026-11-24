import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Reveal } from '@/components/reveal'
import { TrackForm } from '@/components/track-form'
import { Chip, LinkButton, SectionHeader } from '@/components/ui'
import { listIncidents } from '@/server/services/incidents'
import { WireMemo } from '@/components/wire/memo'

/** Yang tercatat di setiap serah terima: inti produk, digambar sebagai garis bukti. */
const CUSTODY = [
  { place: 'Diambil kurir', proof: 'Foto paket, berat, dan nomor segel' },
  { place: 'Hub transit', proof: 'Dipindai dan ditimbang ulang, dibandingkan dengan catatan awal' },
  { place: 'Dalam pengantaran', proof: 'Kurir, waktu, dan rute tercatat' },
  { place: 'Diterima', proof: 'OTP atau QR dari penerima, dengan foto serah terima' },
]

const STEPS = [
  { title: 'Lacak dengan nomor resi', body: 'Lihat setiap status beserta sumbernya: pindai hub, OTP, atau foto kurir.' },
  { title: 'Simpan bukti unboxing', body: 'Masuk, klaim paket Anda, lalu unggah foto atau video saat membuka paket.' },
  { title: 'Laporkan bila ada masalah', body: 'Bukti terlampir otomatis dan kasus Anda dipantau sampai selesai.' },
]

const at = (i: number) => ({ '--i': i }) as CSSProperties

export default async function Beranda() {
  const incidents = await listIncidents()
  return (
    <Reveal>
      <WireMemo scope="/" shape={{ incidents: Math.min(3, incidents.length) }} />
      <div>
        <header className="wx pt-12 pb-16 md:pt-20 lg:pb-24">
          <div className="flex max-w-[760px] flex-col gap-6">
            <h1 className="text-[36px] leading-[1.08] font-semibold tracking-[-0.03em] text-navy-d md:text-[52px]">Lacak paket dengan bukti, bukan sekadar status.</h1>
            <p className="max-w-[54ch] text-[17px] leading-relaxed text-mut">
              Setiap status menunjukkan sumbernya. Bukti serah terima, rute, dan pemeriksaan identitas paket terlihat sejak awal, tanpa perlu meminta ke kurir.
            </p>
            <div className="mt-2 max-w-[640px]">
              <TrackForm hero />
              <p className="mt-3 text-[13px] text-mut">
                Belum punya resi? Coba <Link className="lnk font-mono font-medium" href="/lacak/JT110461625999">JT110461625999</Link>
              </p>
            </div>
          </div>

          <figure className="mt-16 md:mt-20">
            <ol className="relative grid gap-7 pl-7 md:grid-cols-4 md:gap-6 md:pl-0">
              <span aria-hidden className="custody-line-v absolute top-1.5 bottom-6 left-[5px] w-px bg-navy md:hidden" />
              <span aria-hidden className="custody-line absolute top-[5.5px] right-[calc(25%-18px)] left-1 hidden h-px bg-navy md:block" />
              {CUSTODY.map((c, i) => {
                const last = i === CUSTODY.length - 1
                return (
                  <li key={c.place} className="relative flex flex-col gap-1.5 md:pt-8 md:pr-6">
                    <span
                      aria-hidden
                      style={at(i)}
                      className={`custody-node absolute top-0.5 -left-7 size-[11px] rounded-full md:top-0 md:left-0 ${last ? 'border-[1.5px] border-navy bg-bg ring-4 ring-nb-bg' : 'bg-navy'}`}
                    />
                    <span style={at(i)} className="custody-text font-semibold">{c.place}</span>
                    <span style={at(i)} className="custody-text max-w-[30ch] text-[14px] text-mut">{c.proof}</span>
                  </li>
                )
              })}
            </ol>
            <figcaption className="mt-8 text-[13px] text-mut">Yang tercatat di setiap serah terima, dan bisa Anda periksa sendiri.</figcaption>
          </figure>
        </header>

        <section className="wx pb-16 lg:pb-24" aria-labelledby="cara-kerja">
          <div className="sec">
            <SectionHeader title={<span id="cara-kerja">Cara kerja</span>} />
            <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="num text-[15px] font-semibold text-navy" aria-hidden>{i + 1}</span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-mut">{s.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="on-navy bg-navy text-white" aria-label="Studi kasus">
          <div className="wx grid gap-12 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
            <div className="flex max-w-[620px] flex-col gap-5">
              <h2 className="text-[26px] leading-tight font-semibold md:text-[34px]">Paket tertukar di jalur pengiriman, penerima dituduh lebih dulu.</h2>
              <p className="text-[16px] leading-relaxed text-[#DCE5F4]">
                Ketika data pelacakan tertutup, konsumen mudah disalahkan sementara penyebab operasional tetap tersembunyi. Lihat bagaimana E-Shipmennt menanganinya.
              </p>
              <p className="text-[13px] text-[#9FB3D6]">Disusun sesuai laporan di Media Konsumen.</p>
              <div className="mt-2"><LinkButton href="/studi-kasus" variant="white">Baca studi kasus</LinkButton></div>
            </div>
            <div className="flex flex-col gap-4 border-t border-white/20 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              <h3 className="text-[17px] font-semibold">Ada masalah dengan paket?</h3>
              <p className="text-[#DCE5F4]">Paket rusak, tertukar, atau tidak sampai? Laporkan dengan bukti unboxing Anda dan pantau penanganannya.</p>
              <div><LinkButton href="/lapor" variant="white" icon="flag">Laporkan masalah</LinkButton></div>
            </div>
          </div>
        </section>

        <section className="wx py-16 lg:py-24" aria-labelledby="insiden">
          <SectionHeader title={<span id="insiden">Pengungkapan insiden terbaru</span>} action={<Link className="lnk text-[14px]" href="/transparansi">Lihat semua</Link>}>
            Penyebab dan perbaikan dipublikasikan tanpa data pribadi.
          </SectionHeader>
          <ul className="mt-8 border-t border-line">
            {incidents.slice(0, 3).map((i) => (
              <li key={i.id} className="flex flex-col gap-3 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold">{i.title}</span>
                  <span className="text-[14px] text-mut">Penyebab: {i.cause}. Perbaikan: {i.fix}.</span>
                </div>
                <Chip tone={i.resolutionDays > 5 ? 'wn' : 'ok'} icon={i.resolutionDays > 5 ? 'clock' : 'check'} className="self-start sm:self-auto">Selesai dalam {i.resolutionDays} hari</Chip>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Reveal>
  )
}
