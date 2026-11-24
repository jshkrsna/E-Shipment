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

const item = (on: boolean) =>
  cx(
    'relative flex min-h-11 items-center gap-3 rounded-r px-3 text-[14px] font-medium transition-colors',
    on ? 'bg-white/[0.08] text-white before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-white' : 'text-[#9FB3D6] hover:text-white',
  )

function NavLinks({ pathname, baru }: { pathname: string; baru: number }) {
  return (
    <>
      {ITEMS.map((it) => {
        const on = it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href)
        return (
          <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} className={item(on)}>
            <Icon name={it.icon} size={18} />
            <span className="grow">{it.label}</span>
            {it.badge && baru > 0 && (
              <span className="num grid min-w-6 place-items-center rounded-full bg-er px-1.5 text-[13px] font-semibold text-white">
                {baru}<span className="sr-only"> laporan baru</span>
              </span>
            )}
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
    <div className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-4">
      <Link href="/admin/akun" aria-current={pathname === '/admin/akun' ? 'page' : undefined} className={item(pathname === '/admin/akun')}><Icon name="user" size={17} />Profil saya</Link>
      <Link href="/" className={item(false)}><Icon name="external" size={17} />Lihat situs publik</Link>
      <button type="button" onClick={logout} className={cx(item(false), 'text-left text-[#FFB4AB] hover:text-[#FFD4CE]')}><Icon name="logout" size={17} />Keluar</button>
      <span className="mt-3 px-3 text-[13px] text-[#9FB3D6]"><span className="font-medium text-white">{name}</span><br />Admin ekspedisi</span>
    </div>
  )

  return (
    <div className="flex min-h-dvh">
      <aside style={{ viewTransitionName: 'admin-side' }} className="on-navy sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-0.5 bg-navy-d px-4 py-5 lg:flex">
        <Link href="/admin" className="px-3 pb-6"><Logo light label="Admin Ekspedisi" /></Link>
        <NavLinks pathname={pathname} baru={baru} />
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header style={{ viewTransitionName: 'admin-top' }} className="on-navy sticky top-0 z-40 flex min-h-14 items-center gap-3 bg-navy-d px-4 text-white lg:hidden">
          <Link href="/admin"><Logo light label="Admin" /></Link>
          <span className="grow" />
          {baru > 0 && <Link href="/admin/laporan" className="num rounded-full bg-er px-2.5 py-0.5 text-[13px] font-semibold text-white">{baru} baru</Link>}
          <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-r" aria-label="Buka menu admin" aria-expanded={open}><Icon name="menu" size={22} /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
            <button type="button" aria-label="Tutup menu" className="anim-fade absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
            <div className="on-navy anim-drawer-l absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col gap-0.5 bg-navy-d p-4">
              <div className="flex items-center justify-between pb-4">
                <Logo light label="Admin Ekspedisi" />
                <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-r text-white" aria-label="Tutup menu"><Icon name="x" size={22} /></button>
              </div>
              <NavLinks pathname={pathname} baru={baru} />
              {footer}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 text-[14px]">{children}</main>
      </div>
    </div>
  )
}
