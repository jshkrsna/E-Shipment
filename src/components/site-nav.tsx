'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from './icon'
import { btnClass, cx } from './ui'

export type NavUser = { name: string; role: 'PENGGUNA' | 'ADMIN' } | null

export const NAV_ITEMS = [
  { href: '/', label: 'Beranda', match: (p: string) => p === '/' },
  { href: '/lacak', label: 'Lacak', match: (p: string) => p.startsWith('/lacak') || p.startsWith('/bukti') },
  { href: '/transparansi', label: 'Transparansi', match: (p: string) => p.startsWith('/transparansi') },
  { href: '/studi-kasus', label: 'Studi kasus', match: (p: string) => p.startsWith('/studi-kasus') },
  { href: '/bantuan', label: 'Bantuan', match: (p: string) => p.startsWith('/bantuan') },
]

export function Logo({ light = false, label = 'E-Shipmennt' }: { light?: boolean; label?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]', light ? 'text-white' : 'text-navy')}>
      <Icon name="box" size={22} strokeWidth={1.6} />
      {label}
    </span>
  )
}

async function doLogout(router: ReturnType<typeof useRouter>) {
  await fetch('/api/auth/logout', { method: 'POST' })
  router.push('/')
  router.refresh()
}

const menuItem = 'flex min-h-10 items-center gap-2.5 rounded-[6px] px-3 text-[14px] font-medium transition-colors'

function AccountMenu({ user }: { user: NonNullable<NavUser> }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-r px-2 text-[14px] font-medium text-nu transition-colors hover:text-navy"
      >
        <span className="grid size-7 place-items-center rounded-full bg-nb-bg text-[13px] font-semibold text-navy" aria-hidden>{user.name.trim().charAt(0).toUpperCase()}</span>
        <span className="max-w-[140px] truncate">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="anim-pop absolute right-0 z-50 mt-2 w-56 rounded-p border border-line bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(13,33,66,0.25)]" onMouseLeave={() => setOpen(false)}>
          {user.role === 'ADMIN' ? (
            <Link href="/admin" className={cx(menuItem, 'hover:bg-bg')}><Icon name="grid" size={16} />Panel admin</Link>
          ) : (
            <>
              <Link href="/kasus" className={cx(menuItem, 'hover:bg-bg')}><Icon name="doc" size={16} />Kasus saya</Link>
              <Link href="/akun" className={cx(menuItem, 'hover:bg-bg')}><Icon name="user" size={16} />Profil saya</Link>
            </>
          )}
          <hr className="hr mx-2 my-1" />
          <button type="button" onClick={() => doLogout(router)} className={cx(menuItem, 'w-full text-left text-er hover:bg-er-bg')}>
            <Icon name="logout" size={16} />Keluar
          </button>
        </div>
      )}
    </div>
  )
}

export function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const drawerLink = (on: boolean) =>
    cx('flex min-h-12 items-center border-l-2 px-4 text-[16px] font-medium transition-colors', on ? 'border-navy text-navy' : 'border-transparent text-nu hover:text-navy')

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Menu utama" style={{ viewTransitionName: 'site-nav' }} className="sticky top-0 z-40 hidden border-b border-line bg-bg/90 backdrop-blur-md lg:block">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-10 px-8">
          <Link href="/" aria-label="E-Shipmennt, ke beranda"><Logo /></Link>
          <div className="flex grow items-center gap-7">
            {NAV_ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={it.match(pathname) ? 'page' : undefined}
                className={cx(
                  'relative inline-flex min-h-16 items-center text-[14px] font-medium transition-colors',
                  it.match(pathname) ? 'text-navy after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-navy' : 'text-mut hover:text-navy',
                )}
              >
                {it.label}
              </Link>
            ))}
          </div>
          {user?.role !== 'ADMIN' && (
            <Link href="/lapor" className={btnClass('secondary')}>
              <Icon name="flag" size={17} />Laporkan masalah
            </Link>
          )}
          {user ? <AccountMenu user={user} /> : <Link href="/masuk" className={btnClass('primary')}>Masuk</Link>}
        </div>
      </nav>

      {/* Mobile & tablet */}
      <header style={{ viewTransitionName: 'site-nav' }} className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label="E-Shipmennt, ke beranda"><Logo /></Link>
        <span className="grow" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open} className="grid size-11 place-items-center rounded-r text-navy">
          <Icon name="menu" size={22} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button type="button" aria-label="Tutup menu" className="anim-fade absolute inset-0 bg-navy-d/40" onClick={() => setOpen(false)} />
          <div className="anim-drawer-r absolute inset-y-0 right-0 flex w-[min(340px,88vw)] flex-col bg-white">
            <div className="flex min-h-14 items-center justify-between px-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="grid size-11 place-items-center rounded-r text-nu hover:text-navy">
                <Icon name="x" size={22} />
              </button>
            </div>
            <div className="flex flex-col py-4">
              {NAV_ITEMS.map((it) => (
                <Link key={it.href} href={it.href} aria-current={it.match(pathname) ? 'page' : undefined} className={drawerLink(it.match(pathname))}>
                  {it.label}
                </Link>
              ))}
              {user?.role === 'PENGGUNA' && (
                <>
                  <hr className="hr mx-4 my-3" />
                  <Link href="/kasus" className={drawerLink(pathname.startsWith('/kasus'))}>Kasus saya</Link>
                  <Link href="/akun" className={drawerLink(pathname.startsWith('/akun'))}>Profil saya</Link>
                </>
              )}
              {user?.role === 'ADMIN' && <Link href="/admin" className={drawerLink(false)}>Panel admin</Link>}
            </div>
            <div className="mt-auto flex flex-col gap-2 border-t border-line p-4">
              {user?.role !== 'ADMIN' && <Link href="/lapor" className={btnClass('primary')}><Icon name="flag" size={17} />Laporkan masalah</Link>}
              {user ? (
                <>
                  <button type="button" onClick={() => doLogout(router)} className={btnClass('ghost', 'text-er hover:bg-er-bg hover:text-er')}><Icon name="logout" size={17} />Keluar</button>
                  <p className="text-center text-[13px] text-mut">Masuk sebagai <b className="font-semibold text-txt">{user.name}</b></p>
                </>
              ) : (
                <Link href="/masuk" className={btnClass('secondary')}>Masuk</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
