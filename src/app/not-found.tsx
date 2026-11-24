import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-[48px] font-semibold text-navy">404</p>
        <h1 className="text-[20px] font-semibold">Halaman tidak ditemukan</h1>
        <Link className="lnk" href="/">Kembali ke beranda</Link>
      </div>
    </main>
  )
}
