import Link from 'next/link'
import { Icon } from '@/components/icon'
import { TrackForm } from '@/components/track-form'
import { Banner, Card, Chip, LinkButton } from '@/components/ui'
import { listIncidents } from '@/server/services/incidents'
import { getTracking } from '@/server/services/shipments'
import { fmtDate, fmtTime } from '@/lib/format'

const SAMPLE = 'JT110461625999'

export default async function Beranda() {
  const [incidents, sample] = await Promise.all([listIncidents(), getTracking(SAMPLE, null)])
  const ok = sample?.checks.find((c) => c.result === 'match')
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="wx flex flex-col gap-8 py-10 lg:flex-row lg:items-start lg:gap-12 lg:py-14">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="up">Pelacakan dengan bukti</span>
              <h1 className="max-w-[560px] text-[28px] leading-tight font-extrabold md:text-[32px]">Lacak paket dengan bukti, bukan sekadar status.</h1>
              <p className="max-w-[520px] text-[16px] text-mut">
                Setiap status menunjukkan sumbernya. Bukti serah terima, rute, dan pemeriksaan identitas paket terlihat sejak awal, tanpa perlu meminta ke kurir.
              </p>
            </div>
            <div className="max-w-[560px]">
              <TrackForm initial={SAMPLE} />
            </div>
          </div>

          {sample && (
            <Link href={`/lacak/${SAMPLE}`} className="card flex w-full flex-col gap-3 transition-shadow hover:shadow-md lg:max-w-[440px]" aria-label="Contoh hasil pelacakan, buka detail">
              <div className="flex items-center justify-between">
                <span className="up">Contoh hasil</span>
                <span className="font-mono text-[12px] text-mut">{SAMPLE}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[24px] font-extrabold">{sample.shipment.status}</span>
                <Chip tone="ok" icon="shield">Terverifikasi {sample.shipment.statusSource}</Chip>
              </div>
              {sample.shipment.statusAt && (
                <p className="text-mut">
                  {sample.shipment.status}, diverifikasi {sample.shipment.statusSource} pukul {fmtTime(sample.shipment.statusAt)} · {fmtDate(sample.shipment.statusAt)}
                </p>
              )}
              <hr className="hr" />
              {sample.firstMismatch && (
                <Banner tone="er" icon="alert">
                  <p className="text-[12px]">Kami menemukan ketidakcocokan identitas paket di {sample.firstMismatch.hub}. Investigasi dibuka otomatis.</p>
                </Banner>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {ok && <><Chip tone="ok" icon="check">Cocok</Chip><span className="text-[12px] text-mut">{ok.hub}</span></>}
                {sample.firstMismatch && <><Chip tone="er" icon="x">Tidak cocok</Chip><span className="text-[12px] text-mut">{sample.firstMismatch.hub.replace('Transit ', '')}</span></>}
              </div>
            </Link>
          )}
        </div>
      </header>

      <section className="wx py-10" aria-label="Yang kami tunjukkan">
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { icon: 'shield' as const, color: 'text-ok', title: 'Status terverifikasi', body: 'Setiap status memuat sumbernya (pindai, OTP, atau foto), waktu, dan tempat.' },
            { icon: 'camera' as const, color: 'text-blue', title: 'Bukti serah terima', body: 'Foto, OTP atau QR, dan cap waktu tersimpan otomatis dan tidak bisa diubah.' },
            { icon: 'doc' as const, color: 'text-nu', title: 'Pengungkapan insiden', body: 'Penyebab, waktu penyelesaian, dan perbaikan dipublikasikan tanpa data pribadi.' },
          ].map((f) => (
            <li key={f.title} className="card flex flex-col gap-2">
              <span className={`flex items-center gap-2 font-semibold ${f.color}`}><Icon name={f.icon} size={20} />{f.title}</span>
              <p className="text-mut">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="wx pb-12" aria-label="Studi kasus">
        <div className="flex flex-col gap-8 rounded-r bg-navy p-6 text-white md:p-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-3">
            <span className="up !text-[#B7C6E2]">Studi kasus · sesuai laporan Media Konsumen</span>
            <h2 className="text-[22px] leading-snug font-extrabold md:text-[24px]">Paket tertukar di jalur pengiriman, penerima dituduh lebih dulu.</h2>
            <p className="max-w-[560px] text-[#DCE5F4]">
              Ketika data pelacakan tertutup, konsumen mudah disalahkan sementara penyebab operasional tetap tersembunyi. Lihat bagaimana E-Shipmennt menanganinya.
            </p>
            <div><LinkButton href="/studi-kasus" variant="white" iconRight="arrow">Baca studi kasus</LinkButton></div>
          </div>
          <div className="flex flex-col gap-2 rounded-r border border-white/25 p-4 lg:max-w-[360px]">
            <span className="up !text-[#B7C6E2]">Fitur adalah usulan</span>
            <p className="text-[#DCE5F4]">Semua fitur E-Shipmennt di sini adalah usulan. Bukan klaim tentang cara kerja sistem JNE saat ini.</p>
          </div>
        </div>
      </section>

      <section className="wx pb-14" aria-label="Pengungkapan terbaru">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold">Pengungkapan insiden terbaru</h2>
          <Link className="lnk" href="/transparansi">Lihat semua</Link>
        </div>
        <ul className="flex flex-col gap-2">
          {incidents.slice(0, 3).map((i) => (
            <li key={i.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{i.title}</span>
                <span className="text-[12px] text-mut">Penyebab: {i.cause} · Perbaikan: {i.fix}</span>
              </div>
              <Chip tone={i.resolutionDays > 5 ? 'wn' : 'ok'} icon={i.resolutionDays > 5 ? 'clock' : 'check'}>Selesai dalam {i.resolutionDays} hari</Chip>
            </li>
          ))}
        </ul>
        <p className="note mt-4">Data pada layar ini adalah contoh ilustrasi untuk prototipe konsep.</p>
      </section>
    </>
  )
}
