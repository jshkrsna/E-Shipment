import { Banner, Chip } from '@/components/ui'
import { Reveal } from '@/components/reveal'

export const metadata = { title: 'Studi kasus: paket tertukar' }

const ROWS: [string, React.ReactNode][] = [
  ['Sumber', 'Media Konsumen (@MediaKonsumenID), unggahan di X'],
  ['Kurir', 'JNE (sesuai laporan)'],
  ['Nomor resi', <span key="r" className="font-mono">JT110461625999</span>],
  ['Nilai', <b key="n">Rp397.388</b>],
  ['Hasil', 'Dana dikembalikan penuh pada 28 Jul 2026'],
  ['Pengakuan kurir', 'Kurir mengakui paket tertukar di jalur pengiriman, bukan karena kesalahan penerima'],
  ['Tuduhan sebelumnya', 'Dari marketplace: penipuan, membuka paket sebelum unboxing, dan bersekongkol dengan penjual'],
]

const GAPS = [
  { t: 'Informasi awal tidak menjelaskan penyebab sebenarnya.', i: 'konsumen menebak-nebak dan tidak punya dasar membela diri.', r: 'kasus dibuka dengan status berbahasa sederhana dan kategori penyebab sejak laporan pertama.' },
  { t: 'Konsumen menanggung tuduhan sebelum investigasi internal selesai.', i: 'kerugian uang dan nama baik bagi orang yang tidak bersalah.', r: 'spanduk netral “belum ada pihak bersalah” dan pernyataan kasus PDF dari kurir.' },
  { t: 'Bukti serah terima, rute, dan titik pertukaran tidak dibagikan sejak awal.', i: 'tidak ada bukti bagi konsumen maupun marketplace.', r: 'bukti, rute, dan pemeriksaan identitas terlihat otomatis, plus tautan bukti hanya baca.' },
  { t: 'Kesalahan operasional diakui setelah proses panjang.', i: 'penyelesaian lambat, akar masalah tersembunyi, tanpa akuntabilitas.', r: 'hitung mundur batas waktu tiap tahap dan pengungkapan insiden publik setelah selesai.' },
]

export default function StudiKasusPage() {
  return (
    <Reveal>
      <>
        <header>
          <div className="wx flex flex-col gap-5 pt-12 pb-12 lg:pt-16">
            <p className="text-[14px] font-medium text-navy">Studi kasus, disusun sesuai laporan</p>
            <h1 className="max-w-[820px] text-[30px] leading-[1.12] font-semibold tracking-[-0.025em] text-navy-d md:text-[42px]">Saat data pelacakan tertutup, konsumen mudah disalahkan sementara penyebab sebenarnya tersembunyi.</h1>
            <p className="max-w-[62ch] text-[17px] leading-relaxed text-mut">Kasus 2: paket tertukar di jalur pengiriman, penerima lebih dulu dituduh melakukan kecurangan. Halaman ini menunjukkan celahnya dan cara E-Shipmennt menutupnya.</p>
          </div>
        </header>

        <section className="wx grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-[21px] font-semibold">Kasus sebagaimana dilaporkan</h2>
            <dl className="border-t border-line">
              {ROWS.map(([k, v]) => (
                <div key={k} className="grid gap-1 border-b border-line py-3.5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
                  <dt className="text-mut">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="flex flex-col gap-3 lg:pt-12">
            <Banner tone="wn" icon="alert"><div className="flex flex-col gap-1"><span className="font-semibold">Belum diverifikasi secara independen</span><p className="text-[13px]">Unggahan sumber tidak dapat dibuka dan belum ada pemberitaan yang cocok. Semua rincian berlabel “sesuai laporan”.</p></div></Banner>
            <Banner tone="nu" icon="info"><p className="text-[13px]">Identitas konsumen dalam laporan tidak ditampilkan. E-Shipmennt tidak berafiliasi dengan JNE.</p></Banner>
          </aside>
        </section>

        <section className="wx pb-16">
          <div className="sec">
            <h2 className="text-[21px] font-semibold">Empat celah transparansi dan respons desain</h2>
            <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {GAPS.map((g, i) => (
                <article key={i} className="flex flex-col gap-3 border-l border-er/40 pl-5">
                  <p className="text-[17px] leading-snug font-semibold">{g.t}</p>
                  <p className="text-mut">Dampak: {g.i}</p>
                  <p><span className="font-semibold text-navy">Respons:</span> {g.r}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="wx pb-20">
          <div className="sec">
          <h2 className="mb-8 text-[21px] font-semibold">Sebelum dan sesudah</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card flex flex-col gap-4 border-dashed bg-transparent">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Tanpa transparansi (sesuai laporan)</span><Chip tone="er" icon="x">Konsumen disalahkan</Chip></div>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-line-d">
                <li>Status “diterima” tanpa bukti yang dapat dilihat penerima.</li><li>Titik pertukaran paket tidak terlihat.</li><li>Tuduhan datang sebelum penyebab dipastikan.</li><li>Pengembalian dana setelah kurir mengakui kesalahan.</li>
              </ul>
            </div>
            <div className="card flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Dengan E-Shipmennt</span><Chip tone="ok" icon="check">Bukti terlihat</Chip></div>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-line-d">
                <li>Status terverifikasi menyebut sumbernya, mis. “OTP pukul 14:02”.</li><li>Ketidakcocokan pertama ditandai di linimasa dan peta.</li><li>Spanduk netral selama investigasi berjalan.</li><li>Ringkasan penyelesaian dan pengungkapan insiden publik.</li>
              </ul>
            </div>
          </div>
          <p className="note mt-8">Sumber: Media Konsumen (@MediaKonsumenID), unggahan di X (belum diverifikasi independen).</p>
          </div>
        </section>
      </>
    </Reveal>
  )
}
