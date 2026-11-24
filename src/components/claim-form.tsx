'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { Button } from './ui'

export function ClaimForm({ awb }: { awb: string }) {
  const router = useRouter()
  const [last4, setLast4] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(`/api/shipments/${awb}/claim`, { method: 'POST', json: { last4 } })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label className="lbl !mb-0" htmlFor="last4">4 digit terakhir nomor telepon penerima</label>
      <div className="flex gap-2">
        <input id="last4" inputMode="numeric" maxLength={4} pattern="\d{4}" className="in w-32 font-mono tracking-[0.3em]" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="••••" required />
        <Button type="submit" disabled={busy || last4.length !== 4}>{busy ? 'Memeriksa…' : 'Klaim paket'}</Button>
      </div>
      {error && <p className="text-[13px] font-semibold text-er" role="alert">{error}</p>}
      <p className="hint">Klaim memastikan hanya penerima yang dapat menambah bukti dan melapor.</p>
    </form>
  )
}
