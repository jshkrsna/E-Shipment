import { Banner, Card, Chip, LinkButton } from '@/components/ui'

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
    <>
      <header className="border-b border-line bg-white">
        <div className="wx flex max-w-[1280px] flex-col gap-4 py-10 lg:py-12">
          <div className="flex flex-wrap items-center gap-2"><span className="up">Studi kasus · sesuai laporan</span><span className="proto">Prototipe konsep</span></div>
          <h1 className="max-w-[760px] text-[26px] leading-tight font-extrabold md:text-[32px]">Saat data pelacakan tertutup, konsumen mudah disalahkan sementara penyebab sebenarnya tersembunyi.</h1>
          <p className="max-w-[760px] text-[16px] text-mut">Kasus 2: paket tertukar di jalur pengiriman, penerima lebih dulu dituduh melakukan kecurangan. Halaman ini menunjukkan celahnya dan cara E-Shipmennt menutupnya.</p>
        </div>
      </header>

      <section className="wx grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-[20px] font-bold">Kasus sebagaimana dilaporkan</h2>
          <div className="card overflow-hidden p-0">
            <table className="tbl"><tbody>
              {ROWS.map(([k, v]) => (
                <tr key={k} className="flex flex-col md:table-row"><td className="w-[180px] !border-b-0 pb-0 text-mut md:!border-b md:pb-3">{k}</td><td>{v}</td></tr>
              ))}
            </tbody></table>
          </div>
        </div>
        <aside className="flex flex-col gap-3 lg:pt-12">
          <Banner tone="wn" icon="alert"><div className="flex flex-col gap-1"><span className="font-semibold">Belum diverifikasi secara independen</span><p className="text-[12px]">Unggahan sumber tidak dapat dibuka dan belum ada pemberitaan yang cocok. Semua rincian berlabel “sesuai laporan”.</p></div></Banner>
          <Banner tone="nu" icon="info"><p className="text-[12px]">Identitas konsumen dalam laporan tidak ditampilkan. Fitur E-Shipmennt adalah usulan, bukan klaim tentang cara kerja sistem JNE.</p></Banner>
        </aside>
      </section>

      <section className="wx pb-8">
        <h2 className="mb-4 text-[20px] font-bold">Empat celah transparansi dan respons desain</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {GAPS.map((g, i) => (
            <article key={i} className="card flex flex-col gap-2">
              <Chip tone="er" className="self-start">Celah {i + 1}</Chip>
              <p className="font-semibold">{g.t}</p>
              <p className="text-[12px] text-mut">Dampak: {g.i}</p>
              <hr className="hr" />
              <p className="text-[12px]"><b>Respons:</b> {g.r}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wx pb-12">
        <h2 className="mb-4 text-[20px] font-bold">Sebelum dan sesudah</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Tanpa transparansi (sesuai laporan)</span><Chip tone="er" icon="x">Konsumen disalahkan</Chip></div>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Status “diterima” tanpa bukti yang dapat dilihat penerima.</li><li>Titik pertukaran paket tidak terlihat.</li><li>Tuduhan datang sebelum penyebab dipastikan.</li><li>Pengembalian dana setelah kurir mengakui kesalahan.</li>
            </ul>
          </Card>
          <Card className="flex flex-col gap-3 border-ok">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Dengan E-Shipmennt (usulan)</span><Chip tone="ok" icon="check">Bukti terlihat</Chip></div>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Status terverifikasi menyebut sumbernya, mis. “OTP pukul 14:02”.</li><li>Ketidakcocokan pertama ditandai di linimasa dan peta.</li><li>Spanduk netral selama investigasi berjalan.</li><li>Ringkasan penyelesaian dan pengungkapan insiden publik.</li>
            </ul>
            <LinkButton href="/lacak/JT110461625999" variant="secondary" className="self-start">Lihat contoh pelacakan</LinkButton>
          </Card>
        </div>
        <p className="note mt-6">Sumber: Media Konsumen (@MediaKonsumenID), unggahan di X (belum diverifikasi independen). Data demo ilustrasi.</p>
      </section>
    </>
  )
}
