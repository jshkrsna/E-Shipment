import { SiteNav } from '@/components/site-nav'
import { Logo } from '@/components/site-nav'
import Link from 'next/link'
import { getCurrentUser } from '@/server/services/auth'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav user={user ? { name: user.name, role: user.role } : null} />
      <main className="flex-1">{children}</main>
      <footer className="bg-navy-d text-[#C9D6EC]">
        <div className="wx flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <Logo light />
            <p className="max-w-sm text-[12px]">Prototipe konsep · bukan layanan resmi kurir · data demo ilustrasi.</p>
          </div>
          <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-[13px] font-semibold">
            <Link href="/lacak" className="hover:text-white">Lacak paket</Link>
            <Link href="/transparansi" className="hover:text-white">Transparansi</Link>
            <Link href="/studi-kasus" className="hover:text-white">Studi kasus</Link>
            <Link href="/bantuan" className="hover:text-white">Bantuan & kontak JNE</Link>
            <Link href="/lapor" className="hover:text-white">Laporkan masalah</Link>
            <Link href="/masuk" className="hover:text-white">Masuk</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
