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
    <span className={cx('inline-flex items-center gap-2.5 text-[17px] font-extrabold', light ? 'text-white' : 'text-navy')}>
      <i className={cx('grid size-8 place-items-center rounded-[8px] text-white', light ? 'bg-navy-s' : 'bg-navy')}>
        <Icon name="box" size={18} />
      </i>
      {label}
    </span>
  )
}

async function doLogout(router: ReturnType<typeof useRouter>) {
  await fetch('/api/auth/logout', { method: 'POST' })
  router.push('/')
  router.refresh()
}

function AccountMenu({ user }: { user: NonNullable<NavUser> }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-r border border-line px-3 font-semibold text-nu hover:bg-nu-bg"
      >
        <Icon name="user" size={18} />
        <span className="max-w-[140px] truncate">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-r border border-line bg-white p-1.5 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {user.role === 'ADMIN' ? (
            <Link href="/admin" className="flex min-h-10 items-center gap-2 rounded-[6px] px-3 font-semibold hover:bg-nu-bg"><Icon name="grid" size={16} />Panel admin</Link>
          ) : (
            <>
              <Link href="/kasus" className="flex min-h-10 items-center gap-2 rounded-[6px] px-3 font-semibold hover:bg-nu-bg"><Icon name="doc" size={16} />Kasus saya</Link>
              <Link href="/akun" className="flex min-h-10 items-center gap-2 rounded-[6px] px-3 font-semibold hover:bg-nu-bg"><Icon name="user" size={16} />Profil saya</Link>
            </>
          )}
          <button type="button" onClick={() => doLogout(router)} className="flex min-h-10 w-full items-center gap-2 rounded-[6px] px-3 text-left font-semibold text-er hover:bg-er-bg">
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

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Menu utama" className="sticky top-0 z-40 hidden border-b border-line bg-white lg:block">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-8 px-8">
          <Link href="/" aria-label="E-Shipmennt, ke beranda"><Logo /></Link>
          <div className="flex grow items-center gap-6">
            {NAV_ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={it.match(pathname) ? 'page' : undefined}
                className={cx('inline-flex min-h-16 items-center font-semibold', it.match(pathname) ? 'text-navy shadow-[inset_0_-3px_0_var(--color-navy)]' : 'text-nu hover:text-navy')}
              >
                {it.label}
              </Link>
            ))}
          </div>
          {user?.role !== 'ADMIN' && (
            <Link href="/lapor" className={btnClass('primary')}>
              <Icon name="flag" size={18} />Laporkan masalah
            </Link>
          )}
          {user ? <AccountMenu user={user} /> : <Link href="/masuk" className={btnClass('secondary')}>Masuk</Link>}
        </div>
      </nav>

      {/* Mobile & tablet */}
      <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
        <Link href="/" aria-label="E-Shipmennt, ke beranda"><Logo /></Link>
        <span className="grow" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open} className="grid size-11 place-items-center rounded-r text-navy hover:bg-nu-bg">
          <Icon name="menu" size={24} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-navy-d/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col bg-white shadow-xl">
            <div className="flex min-h-14 items-center justify-between border-b border-line px-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="grid size-11 place-items-center rounded-r text-nu hover:bg-nu-bg">
                <Icon name="x" size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-3">
              {NAV_ITEMS.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={it.match(pathname) ? 'page' : undefined}
                  className={cx('flex min-h-12 items-center rounded-r px-3 font-semibold', it.match(pathname) ? 'bg-nb-bg text-navy shadow-[inset_3px_0_0_var(--color-navy)]' : 'text-nu hover:bg-nu-bg')}
                >
                  {it.label}
                </Link>
              ))}
              {user?.role === 'PENGGUNA' && (
                <>
                  <Link href="/kasus" className={cx('flex min-h-12 items-center rounded-r px-3 font-semibold', pathname.startsWith('/kasus') ? 'bg-nb-bg text-navy' : 'text-nu hover:bg-nu-bg')}>Kasus saya</Link>
                  <Link href="/akun" className={cx('flex min-h-12 items-center rounded-r px-3 font-semibold', pathname.startsWith('/akun') ? 'bg-nb-bg text-navy' : 'text-nu hover:bg-nu-bg')}>Profil saya</Link>
                </>
              )}
              {user?.role === 'ADMIN' && <Link href="/admin" className="flex min-h-12 items-center rounded-r px-3 font-semibold text-nu hover:bg-nu-bg">Panel admin</Link>}
            </div>
            <div className="mt-auto flex flex-col gap-2 border-t border-line p-4">
              {user?.role !== 'ADMIN' && <Link href="/lapor" className={btnClass('primary')}><Icon name="flag" size={18} />Laporkan masalah</Link>}
              {user ? (
                <>
                  <p className="text-center text-[12px] text-mut">Masuk sebagai <b className="text-txt">{user.name}</b></p>
                  <button type="button" onClick={() => doLogout(router)} className={btnClass('danger')}><Icon name="logout" size={18} />Keluar</button>
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
