import Link from 'next/link'
import { Icon } from '@/components/icon'
import { TrackForm } from '@/components/track-form'
import { Chip, LinkButton } from '@/components/ui'
import { listIncidents } from '@/server/services/incidents'

export default async function Beranda() {
  const incidents = await listIncidents()
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
              <TrackForm />
            </div>
          </div>

          <section className="card flex w-full flex-col gap-4 lg:max-w-[440px]" aria-label="Cara kerja">
            <span className="up">Cara kerja</span>
            <ol className="flex flex-col gap-4">
              {[
                { icon: 'search' as const, title: 'Lacak dengan nomor resi', body: 'Lihat setiap status beserta sumbernya: pindai hub, OTP, atau foto kurir.' },
                { icon: 'camera' as const, title: 'Simpan bukti unboxing', body: 'Masuk, klaim paket Anda, lalu unggah foto atau video saat membuka paket.' },
                { icon: 'flag' as const, title: 'Laporkan bila ada masalah', body: 'Bukti terlampir otomatis dan kasus Anda dipantau sampai selesai.' },
              ].map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-nb-bg text-navy" aria-hidden><Icon name={s.icon} size={20} /></span>
                  <div className="flex min-w-0 flex-col">
                    <span className="font-semibold">{i + 1}. {s.title}</span>
                    <span className="text-[13px] text-mut">{s.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
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
          <div className="flex flex-col gap-3 rounded-r border border-white/25 p-4 lg:max-w-[360px]">
            <span className="up !text-[#B7C6E2]">Ada masalah dengan paket?</span>
            <p className="text-[#DCE5F4]">Paket rusak, tertukar, atau tidak sampai? Laporkan dengan bukti unboxing Anda dan pantau penanganannya.</p>
            <div><LinkButton href="/lapor" variant="white" icon="flag">Laporkan masalah</LinkButton></div>
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
      </section>
    </>
  )
}
