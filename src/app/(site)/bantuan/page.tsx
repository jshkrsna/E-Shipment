import Link from 'next/link'
import { Icon, type IconName } from '@/components/icon'
import { Banner, Card, LinkButton, btnClass } from '@/components/ui'
import { JNE_CONTACT } from '@/lib/labels'

export const metadata = { title: 'Bantuan & kontak JNE' }

const CONTACTS: { icon: IconName; title: string; value: string; note: string; href: string; cta: string; external?: boolean }[] = [
  { icon: 'phone', title: 'Call center JNE', value: JNE_CONTACT.phone, note: 'Layanan 24 jam', href: JNE_CONTACT.phoneHref, cta: 'Telepon' },
  { icon: 'mail', title: 'Email customer care', value: JNE_CONTACT.email, note: 'Sertakan nomor resi di subjek', href: `mailto:${JNE_CONTACT.email}?subject=${encodeURIComponent('Kendala paket - [nomor resi]')}`, cta: 'Kirim email' },
  { icon: 'chat', title: 'Live chat JONI', value: 'jne.co.id', note: 'Asisten virtual di situs resmi', href: JNE_CONTACT.web, cta: 'Buka situs JNE', external: true },
]

const FAQ = [
  { q: 'Status “diterima” tapi saya belum menerima paket. Apa yang harus dilakukan?', a: 'Buka halaman Lacak, periksa bukti serah terima. Bila tidak ada OTP/QR atau foto, pilih Laporkan masalah → “Paket tidak diterima”. Kasus dibuka dan anomali otomatis masuk antrean admin.' },
  { q: 'Barang yang saya terima berbeda dari pesanan.', a: 'Simpan foto dan video unboxing di Brankas (tab Bukti), lalu laporkan dengan kategori “Barang tertukar”. Pemeriksaan identitas di setiap hub membantu menemukan titik pertukaran.' },
  { q: 'Apakah bukti saya bisa diubah setelah dilaporkan?', a: 'Tidak. Setiap berkas mendapat cap integritas (SHA-256) dan terkunci setelah dilampirkan ke laporan.' },
  { q: 'Bagaimana membagikan bukti ke marketplace?', a: 'Di halaman kasus, pilih “Bagikan tautan bukti”. Tautan hanya baca, menyamarkan data pribadi, dan dapat dicabut kapan saja. Unduh juga pernyataan kasus (PDF) untuk banding.' },
]

export default function BantuanPage() {
  return (
    <div className="wx flex flex-col gap-8 py-8 lg:py-12">
      <div className="flex max-w-[720px] flex-col gap-2">
        <span className="up">Bantuan</span>
        <h1 className="text-[26px] font-extrabold md:text-[32px]">Hubungi ekspedisi JNE</h1>
        <p className="text-[16px] text-mut">Kontak resmi JNE untuk kendala pengiriman. Untuk sengketa paket, laporkan juga lewat E-Shipmennt agar bukti dan riwayat kasus tercatat.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CONTACTS.map((c) => (
          <Card key={c.title} className="flex flex-col gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-nb-bg text-navy"><Icon name={c.icon} size={22} /></span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-mut">{c.title}</span>
              <span className="text-[18px] font-extrabold break-all">{c.value}</span>
              <span className="text-[12px] text-mut">{c.note}</span>
            </div>
            <a href={c.href} className={btnClass('secondary', 'mt-auto')} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <Icon name={c.icon} size={18} />{c.cta}{c.external && <Icon name="external" size={16} />}
            </a>
          </Card>
        ))}
      </div>

      <Banner tone="wn" icon="alert">
        <p className="text-[13px]"><b>Waspada penipuan:</b> JNE tidak melayani customer service lewat WhatsApp. Jangan berikan OTP, PIN, atau data rekening kepada siapa pun yang mengaku petugas.</p>
      </Banner>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-3">
          <h2 className="text-[20px] font-bold">Pertanyaan umum</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="card group">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {f.q}
                <Icon name="right" size={18} className="transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-mut">{f.a}</p>
            </details>
          ))}
        </section>
        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2">
            <h2 className="text-[16px] font-bold">Siapkan sebelum menghubungi</h2>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px]">
              <li>Nomor resi</li>
              <li>Nama dan nomor telepon penerima</li>
              <li>Foto/video kondisi paket saat dibuka</li>
              <li>Nomor kasus E-Shipmennt (bila sudah melapor)</li>
            </ul>
          </Card>
          <Card className="flex flex-col gap-2">
            <h2 className="text-[16px] font-bold">Pintasan</h2>
            <LinkButton href="/lapor" icon="flag">Laporkan masalah</LinkButton>
            <LinkButton href="/kasus" variant="secondary" icon="doc">Kasus saya</LinkButton>
            <LinkButton href="/lacak" variant="secondary" icon="search">Lacak paket</LinkButton>
          </Card>
        </aside>
      </div>
      <p className="note">Kontak diambil dari situs resmi <Link className="lnk" href="https://www.jne.co.id" target="_blank" rel="noopener noreferrer">jne.co.id</Link> (diperiksa Nov 2026). E-Shipmennt adalah prototipe konsep dan tidak berafiliasi dengan JNE.</p>
    </div>
  )
}
