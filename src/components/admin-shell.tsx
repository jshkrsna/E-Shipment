'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon, type IconName } from './icon'
import { Logo } from './site-nav'
import { cx } from './ui'

const ITEMS: { href: string; label: string; icon: IconName; badge?: 'baru' }[] = [
  { href: '/admin', label: 'Dasbor & anomali', icon: 'grid' },
  { href: '/admin/laporan', label: 'Laporan masuk', icon: 'chat', badge: 'baru' },
  { href: '/admin/pindai', label: 'Pindai checkpoint', icon: 'scan' },
  { href: '/admin/audit', label: 'Log audit', icon: 'list' },
  { href: '/admin/insiden', label: 'Insiden publik', icon: 'doc' },
]

function NavLinks({ pathname, baru }: { pathname: string; baru: number }) {
  return (
    <>
      {ITEMS.map((it) => {
        const on = it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={cx('flex min-h-11 items-center gap-3 rounded-r px-3 font-semibold', on ? 'bg-navy-s text-white' : 'text-[#C9D6EC] hover:bg-white/10')}
          >
            <Icon name={it.icon} size={18} />
            <span className="grow">{it.label}</span>
            {it.badge && baru > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-white px-1.5 text-[12px] font-bold text-er">{baru}</span>}
          </Link>
        )
      })}
    </>
  )
}

export function AdminShell({ name, baru, children }: { name: string; baru: number; children: React.ReactNode }) {
  const pathname = usePathname() || '/admin'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/masuk')
    router.refresh()
  }

  const footer = (
    <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-3">
      <Link href="/admin/akun" aria-current={pathname === '/admin/akun' ? 'page' : undefined} className={cx('flex min-h-10 items-center gap-3 rounded-r px-3 text-[13px] font-semibold', pathname === '/admin/akun' ? 'bg-navy-s text-white' : 'text-[#C9D6EC] hover:bg-white/10')}><Icon name="user" size={16} />Profil saya</Link>
      <Link href="/" className="flex min-h-10 items-center gap-3 rounded-r px-3 text-[13px] font-semibold text-[#C9D6EC] hover:bg-white/10"><Icon name="external" size={16} />Lihat situs publik</Link>
      <button type="button" onClick={logout} className="flex min-h-10 items-center gap-3 rounded-r px-3 text-left text-[13px] font-semibold text-[#FFB4AB] hover:bg-white/10"><Icon name="logout" size={16} />Keluar</button>
      <span className="px-3 text-[12px] text-[#9FB3D6]">{name} · Peran: Admin</span>
    </div>
  )

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-1 bg-navy-d p-4 lg:flex">
        <Link href="/admin" className="px-3 pt-2 pb-4"><Logo light label="Admin Ekspedisi" /></Link>
        <NavLinks pathname={pathname} baru={baru} />
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 bg-navy-d px-4 text-white lg:hidden">
          <Link href="/admin"><Logo light label="Admin" /></Link>
          <span className="grow" />
          {baru > 0 && <Link href="/admin/laporan" className="rounded-full bg-white px-2 text-[12px] font-bold text-er">{baru} baru</Link>}
          <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-r hover:bg-white/10" aria-label="Buka menu admin" aria-expanded={open}><Icon name="menu" size={24} /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
            <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col gap-1 bg-navy-d p-4">
              <div className="flex items-center justify-between pb-3">
                <Logo light label="Admin Ekspedisi" />
                <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-r text-white hover:bg-white/10" aria-label="Tutup menu"><Icon name="x" size={22} /></button>
              </div>
              <NavLinks pathname={pathname} baru={baru} />
              {footer}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
