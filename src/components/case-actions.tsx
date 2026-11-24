'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { fmtDateTime } from '@/lib/format'
import { Icon } from './icon'
import { Banner, Button, btnClass } from './ui'

export function CaseActions({
  code, share, canEscalate, escalated, closed,
}: { code: string; share: { token: string; expiresAt: string } | null; canEscalate: boolean; escalated: boolean; closed: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'er'; text: string } | null>(null)
  const shareUrl = share ? `${typeof window !== 'undefined' ? window.location.origin : ''}/bukti/${share.token}` : ''

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      setMsg({ tone: 'ok', text: ok })
      router.refresh()
    } catch (e) {
      setMsg({ tone: 'er', text: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMsg({ tone: 'ok', text: 'Tautan disalin.' })
    } catch {
      setMsg({ tone: 'er', text: 'Gagal menyalin. Salin manual dari kotak tautan.' })
    }
  }

  return (
    <div className="flex flex-col gap-2" id="bagikan">
      <a href={`/api/cases/${code}/statement`} className={btnClass('primary')}><Icon name="download" size={18} />Unduh pernyataan kasus (PDF)</a>
      {share ? (
        <div className="flex flex-col gap-2.5 rounded-p border border-line bg-white p-4">
          <span className="text-[13px] font-semibold">Tautan bukti hanya baca</span>
          <input readOnly value={shareUrl} className="in font-mono text-[13px]" onFocus={(e) => e.currentTarget.select()} aria-label="Tautan bukti" />
          <span className="text-[13px] text-mut">Berlaku sampai {fmtDateTime(share.expiresAt)}. Data pribadi disamarkan.</span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon="link" onClick={copy}>Salin</Button>
            <a href={`/bukti/${share.token}`} target="_blank" className={btnClass('secondary', false, 'sm')}><Icon name="eye" size={16} />Lihat</a>
            <Button size="sm" variant="danger" disabled={busy === 'revoke'} onClick={() => run('revoke', () => api(`/api/cases/${code}/share`, { method: 'DELETE' }), 'Tautan dicabut.')}>Cabut tautan</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" icon="link" disabled={busy === 'share'} onClick={() => run('share', () => api(`/api/cases/${code}/share`, { method: 'POST' }), 'Tautan bukti dibuat.')}>
          Bagikan tautan bukti
        </Button>
      )}
      {!closed && (
        <Button
          variant="ghost"
          className="border-line-d"
          disabled={!canEscalate || escalated || busy === 'esc'}
          onClick={() => run('esc', () => api(`/api/cases/${code}/escalate`, { method: 'POST' }), 'Kasus dieskalasi.')}
        >
          {escalated ? 'Sudah dieskalasi' : 'Eskalasi kasus'}
        </Button>
      )}
      <p className="hint">Pernyataan PDF dapat dilampirkan pada banding di marketplace.{!closed && !canEscalate && !escalated ? ' Eskalasi aktif bila batas waktu tahap terlewat.' : ''}</p>
      {msg && <Banner tone={msg.tone} icon={msg.tone === 'ok' ? 'check' : 'alert'}><p className="text-[13px]">{msg.text}</p></Banner>}
    </div>
  )
}
