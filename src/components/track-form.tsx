'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from './icon'
import { btnClass, cx } from './ui'

export function TrackForm({ initial = '', compact = false, multiline = true }: { initial?: string; compact?: boolean; multiline?: boolean }) {
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
        <input id="resi-c" className="in grow font-mono" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nomor resi" autoComplete="off" />
        <button type="submit" className={btnClass('primary', 'w-11 shrink-0 px-0')} aria-label="Lacak"><Icon name="search" size={20} /></button>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3" role="search">
      <div>
        <label className="lbl" htmlFor="resi">Nomor resi</label>
        {multiline ? (
          <textarea id="resi" rows={2} className={cx('in font-mono', error && 'border-er')} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="resi-h" placeholder="Contoh: JT110461625999" />
        ) : (
          <input id="resi" className={cx('in font-mono', error && 'border-er')} value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="resi-h" placeholder="Contoh: JT110461625999" />
        )}
        <p className="hint mt-1" id="resi-h">Satu atau beberapa nomor, pisahkan dengan koma atau baris baru. Nomor resi ada di struk atau label paket.</p>
        {error && <p className="mt-1 text-[12px] font-semibold text-er" role="alert">{error}</p>}
      </div>
      <button type="submit" className={btnClass('primary')}><Icon name="search" size={18} />Lacak paket</button>
    </form>
  )
}
