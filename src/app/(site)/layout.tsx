import { SiteNav } from '@/components/site-nav'
import { Logo } from '@/components/site-nav'
import Link from 'next/link'
import { getCurrentUser } from '@/server/services/auth'

const FOOTER_LINKS = [
  { href: '/lacak', label: 'Lacak paket' },
  { href: '/transparansi', label: 'Transparansi' },
  { href: '/studi-kasus', label: 'Studi kasus' },
  { href: '/bantuan', label: 'Bantuan & kontak JNE' },
  { href: '/lapor', label: 'Laporkan masalah' },
  { href: '/masuk', label: 'Masuk' },
]

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav user={user ? { name: user.name, role: user.role } : null} />
      <main className="flex-1">{children}</main>
      <footer className="on-navy bg-navy-d text-[#C9D6EC]">
        <div className="wx flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <Logo light />
            <p className="text-[13px] text-[#9FB3D6]">Layanan independen, tidak berafiliasi dengan perusahaan kurir mana pun.</p>
          </div>
          <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-x-12 gap-y-3 text-[14px]">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
