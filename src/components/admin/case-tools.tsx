'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { fmtRelativeDay } from '@/lib/format'
import { MESSAGE_TEMPLATES, type Tone } from '@/lib/labels'
import { Banner, Button, Chip, cx } from '../ui'

export type ListItem = { code: string; statusLabel: 'Baru' | 'Diproses' | 'Selesai'; tone: Tone; category: string; reporter: string; createdAt: string; escalated: boolean; priority: string }

export function AdminCaseList({ items }: { items: ListItem[] }) {
  const pathname = usePathname() || ''
  const [filter, setFilter] = useState<'Semua' | ListItem['statusLabel']>('Semua')
  const selected = pathname.split('/')[3]
  const shown = filter === 'Semua' ? items : items.filter((i) => i.statusLabel === filter)
  return (
    <div className={cx('flex min-h-0 flex-col border-line bg-white lg:w-[300px] lg:shrink-0 lg:border-r', selected && 'hidden lg:flex')}>
      <div className="flex gap-1.5 overflow-x-auto border-b border-line p-3" role="group" aria-label="Filter status">
        {(['Semua', 'Baru', 'Diproses', 'Selesai'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cx('min-h-9 rounded-full border px-2.5 text-[13px] font-semibold whitespace-nowrap', filter === f ? 'border-navy bg-navy text-white' : 'border-line-d text-nu hover:bg-nu-bg')}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="flex-1 overflow-y-auto">
        {shown.map((i) => (
          <li key={i.code}>
            <Link
              href={`/admin/laporan/${i.code}`}
              aria-current={selected === i.code ? 'page' : undefined}
              className={cx('flex flex-col gap-1 border-b border-line px-4 py-3', selected === i.code ? 'bg-nb-bg shadow-[inset_3px_0_0_var(--color-navy)]' : 'hover:bg-[#F7F9FC]')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold">{i.code}</span>
                <Chip tone={i.tone}>{i.statusLabel}</Chip>
              </div>
              <span className="font-semibold">{i.category}</span>
              <span className="text-[12px] text-mut">
                {i.reporter} · {fmtRelativeDay(i.createdAt)}
                {i.escalated && <b className="ml-1 text-er">· Eskalasi</b>}
              </span>
            </Link>
          </li>
        ))}
        {!shown.length && <li className="p-6 text-center text-mut">Tidak ada laporan.</li>}
      </ul>
    </div>
  )
}

export function AcceptButton({ code }: { code: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <Button
        icon="check"
        className="self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError('')
          try {
            await api(`/api/admin/cases/${code}/accept`, { method: 'POST' })
            router.refresh()
          } catch (e) {
            setError((e as Error).message)
            setBusy(false)
          }
        }}
      >
        {busy ? 'Memproses…' : 'Terima laporan'}
      </Button>
      {error && <p className="text-[12px] font-semibold text-er">{error}</p>}
    </div>
  )
}

export function CaseControls({
  code, status, assigneeId, admins, cause, closed,
}: { code: string; status: string; assigneeId: number | null; admins: { id: number; name: string }[]; cause: string | null; closed: boolean }) {
  const router = useRouter()
  const [st, setSt] = useState(status === 'BARU' ? 'DIPROSES' : status)
  const [as, setAs] = useState(assigneeId ? String(assigneeId) : '')
  const [cs, setCs] = useState(cause ?? '')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'er'; text: string } | null>(null)
  const disabled = status === 'BARU' || closed
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    try {
      await api(`/api/admin/cases/${code}`, {
        method: 'PATCH',
        json: { ...(st !== 'SELESAI' ? { status: st } : {}), assigneeId: as ? Number(as) : null, cause: cs },
      })
      setMsg({ tone: 'ok', text: 'Perubahan disimpan dan dicatat di jejak audit.' })
      router.refresh()
    } catch (err) {
      setMsg({ tone: 'er', text: (err as Error).message })
    }
  }
  return (
    <form onSubmit={save} className="card flex flex-col gap-3">
      <h2 className="text-[16px] font-bold">Status kasus</h2>
      {status === 'BARU' && <p className="hint">Terima laporan terlebih dahulu.</p>}
      <div>
        <label className="lbl" htmlFor={`st-${code}`}>Status</label>
        <select id={`st-${code}`} className="in" value={st} onChange={(e) => setSt(e.target.value)} disabled={disabled}>
          <option value="DIPROSES">Sedang diselidiki</option>
          <option value="PENYEBAB_DITEMUKAN">Penyebab teridentifikasi</option>
          {closed && <option value="SELESAI">Selesai</option>}
        </select>
        <p className="hint mt-1">Status Selesai lewat tombol Tutup laporan pada validasi.</p>
      </div>
      <div>
        <label className="lbl" htmlFor={`as-${code}`}>Penugasan</label>
        <select id={`as-${code}`} className="in" value={as} onChange={(e) => setAs(e.target.value)} disabled={disabled}>
          <option value="">Belum ditugaskan</option>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor={`cs-${code}`}>Penyebab (bila sudah teridentifikasi)</label>
        <textarea id={`cs-${code}`} rows={2} className="in" value={cs} onChange={(e) => setCs(e.target.value)} disabled={disabled} placeholder="Contoh: kesalahan penanganan di hub transit" />
      </div>
      {!disabled && <Button type="submit" variant="secondary">Simpan perubahan</Button>}
      {msg && <Banner tone={msg.tone} icon={msg.tone === 'ok' ? 'check' : 'alert'}><p className="text-[13px]">{msg.text}</p></Banner>}
    </form>
  )
}

export function NotesForm({ code }: { code: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setError('')
        try {
          await api(`/api/admin/cases/${code}/notes`, { method: 'POST', json: { body } })
          setBody('')
          router.refresh()
        } catch (err) {
          setError((err as Error).message)
        }
      }}
    >
      <label htmlFor={`note-${code}`} className="sr-only">Catatan internal</label>
      <textarea id={`note-${code}`} rows={3} className="in" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Contoh: minta rekaman foto pindai Padalarang." />
      <span className="hint">Hanya terlihat oleh tim admin.</span>
      {error && <p className="text-[12px] font-semibold text-er">{error}</p>}
      <Button type="submit" variant="secondary" size="sm" className="self-start" disabled={!body.trim()}>Tambah catatan</Button>
    </form>
  )
}

/** Template pesan investigasi (eks O3 "Pesan untuk pelanggan"). */
export function CustomerMessage({ code, disabled }: { code: string; disabled: boolean }) {
  const router = useRouter()
  const [tpl, setTpl] = useState(0)
  const [body, setBody] = useState<string>(MESSAGE_TEMPLATES[0].text)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'er'; text: string } | null>(null)
  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-[16px] font-bold">Pesan untuk pelanggan</h2>
      <div className="flex flex-wrap gap-2">
        {MESSAGE_TEMPLATES.map((t, i) => (
          <button key={t.label} type="button" aria-pressed={tpl === i} onClick={() => { setTpl(i); setBody(t.text) }} className={cx('min-h-9 rounded-full border px-3 text-[13px] font-semibold', tpl === i ? 'border-navy bg-navy text-white' : 'border-line-d text-nu')}>
            {t.label}
          </button>
        ))}
      </div>
      <label htmlFor={`cm-${code}`} className="sr-only">Pesan</label>
      <textarea id={`cm-${code}`} rows={4} className="in" value={body} onChange={(e) => setBody(e.target.value)} disabled={disabled} />
      <Button
        icon="send"
        disabled={disabled || !body.trim()}
        onClick={async () => {
          setMsg(null)
          try {
            await api(`/api/cases/${code}/messages`, { method: 'POST', json: { body } })
            setMsg({ tone: 'ok', text: 'Pesan terkirim ke halaman kasus pelanggan.' })
            router.refresh()
          } catch (e) {
            setMsg({ tone: 'er', text: (e as Error).message })
          }
        }}
      >
        Kirim ke pelanggan
      </Button>
      {msg && <Banner tone={msg.tone} icon={msg.tone === 'ok' ? 'check' : 'alert'}><p className="text-[13px]">{msg.text}</p></Banner>}
    </div>
  )
}
