'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from './ui'

export function TrackTabs({ awb }: { awb: string }) {
  const p = usePathname() || ''
  const base = `/lacak/${awb}`
  const tabs = [
    { href: base, label: 'Linimasa', on: p === base },
    { href: `${base}/rute`, label: 'Rute', on: p.endsWith('/rute') },
    { href: `${base}/bukti`, label: 'Bukti', on: p.endsWith('/bukti') },
  ]
  return (
    <nav aria-label="Bagian pelacakan" className="flex border-b border-line bg-white lg:rounded-t-r lg:border lg:border-b">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.on ? 'page' : undefined}
          className={cx('flex min-h-11 flex-1 items-center justify-center border-b-[3px] font-semibold', t.on ? 'border-navy text-navy' : 'border-transparent text-mut hover:text-navy')}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
