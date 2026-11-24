'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { INCIDENT_TYPES } from '@/lib/labels'
import { Banner, Button } from '../ui'

export type ClosedCase = { code: string; label: string; cause: string | null; days: number }

export function IncidentForm({ cases }: { cases: ClosedCase[] }) {
  const router = useRouter()
  const empty = { caseCode: '', type: 'Paket tertukar' as string, title: '', cause: '', fix: '', resolutionDays: '' }
  const [f, setF] = useState(empty)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'er'; text: string } | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }))

  function pickCase(code: string) {
    const c = cases.find((x) => x.code === code)
    setF((x) => ({ ...x, caseCode: code, cause: c?.cause ?? x.cause, resolutionDays: c ? String(c.days) : x.resolutionDays, title: c && !x.title ? c.label : x.title }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    try {
      const { incident } = await api<{ incident: { code: string } }>('/api/admin/incidents', {
        method: 'POST',
        json: { ...f, caseCode: f.caseCode || null, resolutionDays: Number(f.resolutionDays) },
      })
      setMsg({ tone: 'ok', text: `${incident.code} dipublikasikan di halaman Transparansi.` })
      setF(empty)
      router.refresh()
    } catch (err) {
      setMsg({ tone: 'er', text: (err as Error).message })
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">Publikasikan insiden</h2>
      <div>
        <label className="lbl" htmlFor="case">Dari kasus selesai (opsional)</label>
        <select id="case" className="in" value={f.caseCode} onChange={(e) => pickCase(e.target.value)}>
          <option value="">Tanpa kasus terkait</option>
          {cases.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.label}</option>)}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="lbl" htmlFor="type">Jenis</label>
          <select id="type" className="in" value={f.type} onChange={set('type')}>{INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        <div><label className="lbl" htmlFor="days">Waktu penyelesaian (hari)</label><input id="days" className="in" inputMode="numeric" value={f.resolutionDays} onChange={set('resolutionDays')} required /></div>
      </div>
      <div><label className="lbl" htmlFor="title">Judul insiden</label><input id="title" className="in" value={f.title} onChange={set('title')} required /></div>
      <div><label className="lbl" htmlFor="cause">Penyebab terkonfirmasi</label><textarea id="cause" className="in" rows={2} value={f.cause} onChange={set('cause')} required /></div>
      <div><label className="lbl" htmlFor="fix">Perbaikan</label><textarea id="fix" className="in" rows={2} value={f.fix} onChange={set('fix')} required /></div>
      <p className="hint">Jangan cantumkan nama, alamat, atau nomor resi. Data dipublikasikan tanpa data pribadi.</p>
      <Button type="submit" icon="send" className="self-start">Publikasikan</Button>
      {msg && <Banner tone={msg.tone} icon={msg.tone === 'ok' ? 'check' : 'alert'}><p className="text-[13px]">{msg.text}</p></Banner>}
    </form>
  )
}
