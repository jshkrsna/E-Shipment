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
    <nav aria-label="Bagian pelacakan" className="flex gap-8 border-b border-line px-4 md:px-0 lg:px-6">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.on ? 'page' : undefined}
          className={cx(
            'relative flex min-h-12 items-center text-[14px] font-medium transition-colors',
            t.on ? 'text-navy after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-navy' : 'text-mut hover:text-navy',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
