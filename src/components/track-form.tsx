'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from './icon'
import { btnClass, cx } from './ui'

export function TrackForm({ initial = '', compact = false, hero = false, multiline = true }: { initial?: string; compact?: boolean; hero?: boolean; multiline?: boolean }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const list = value.split(/[\s,;]+/).map((v) => v.trim()).filter(Boolean)
    if (!list.length) return setError('Masukkan minimal satu nomor resi.')
    setError('')
    if (list.length === 1) router.push(`/lacak/${encodeURIComponent(list[0].toUpperCase())}`)
    else router.push(`/lacak?resi=${encodeURIComponent(list.join(','))}`)
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="flex gap-2" role="search">
        <label htmlFor="resi-c" className="sr-only">Nomor resi</label>
        <input id="resi-c" className="in grow font-mono text-[14px]" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nomor resi" autoComplete="off" />
        <button type="submit" className={btnClass('secondary', 'min-h-12 w-12 shrink-0 px-0')} aria-label="Lacak"><Icon name="search" size={19} /></button>
      </form>
    )
  }

  if (hero) {
    return (
      <form onSubmit={submit} role="search" className="flex flex-col gap-2">
        <label htmlFor="resi-h" className="sr-only">Nomor resi</label>
        <div className={cx('flex flex-col gap-2 rounded-p border bg-white p-2 transition-[border-color,box-shadow] focus-within:border-navy focus-within:ring-[3px] focus-within:ring-navy/10 sm:flex-row', error ? 'border-er' : 'border-line-d')}>
          <input
            id="resi-h"
            className="min-h-12 min-w-0 grow bg-transparent px-3 font-mono text-[17px] tracking-[0.01em] text-txt placeholder:text-[#8795AD] focus:outline-none md:text-[19px]"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-describedby="resi-hh"
            placeholder="JT110461625999"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className={btnClass('primary', 'min-h-12 px-6')}>Lacak paket</button>
        </div>
        <p className="hint" id="resi-hh">Nomor resi ada di struk atau label paket. Untuk beberapa paket, pisahkan dengan koma.</p>
        {error && <p className="text-[13px] font-semibold text-er" role="alert">{error}</p>}
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4" role="search">
      <div>
        <label className="lbl" htmlFor="resi">Nomor resi</label>
        {multiline ? (
          <textarea id="resi" rows={2} className={cx('in font-mono', error && 'border-er')} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="resi-h" placeholder="Contoh: JT110461625999" />
        ) : (
          <input id="resi" className={cx('in font-mono', error && 'border-er')} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="resi-h" placeholder="Contoh: JT110461625999" />
        )}
        <p className="hint mt-1.5" id="resi-h">Satu atau beberapa nomor, pisahkan dengan koma atau baris baru. Nomor resi ada di struk atau label paket.</p>
        {error && <p className="mt-1 text-[13px] font-semibold text-er" role="alert">{error}</p>}
      </div>
      <button type="submit" className={btnClass('primary', 'self-start')}><Icon name="search" size={17} />Lacak paket</button>
    </form>
  )
}
