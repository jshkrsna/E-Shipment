'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { Banner, Button } from '../ui'

type Result = { result: 'match' | 'mismatch'; diffs: string[]; isFirstMismatch: boolean }

export function ScanForm({ hubs }: { hubs: string[] }) {
  const router = useRouter()
  const [f, setF] = useState({ awb: '', hub: '', weightKg: '', lengthCm: '', widthCm: '', heightCm: '', sealNo: '' })
  const [res, setRes] = useState<(Result & { awb: string; hub: string }) | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }))
  const num = (s: string) => Number(s.replace(',', '.'))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await api<Result>('/api/admin/scans', {
        method: 'POST',
        json: { awb: f.awb, hub: f.hub, weightKg: num(f.weightKg), lengthCm: num(f.lengthCm), widthCm: num(f.widthCm), heightCm: num(f.heightCm), sealNo: f.sealNo },
      })
      setRes({ ...r, awb: f.awb.toUpperCase(), hub: f.hub })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="lbl" htmlFor="awb">Nomor resi</label><input id="awb" className="in font-mono" value={f.awb} onChange={set('awb')} placeholder="JT110461625100" required /></div>
        <div>
          <label className="lbl" htmlFor="hub">Hub</label>
          <input id="hub" className="in" list="hubs" value={f.hub} onChange={set('hub')} placeholder="Hub Transit Cikarang" required />
          <datalist id="hubs">{hubs.map((h) => <option key={h} value={h} />)}</datalist>
        </div>
        <div><label className="lbl" htmlFor="w">Berat (kg)</label><input id="w" className="in font-mono" inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} placeholder="1,50" required /></div>
        <div><label className="lbl" htmlFor="seal">Nomor segel</label><input id="seal" className="in font-mono" value={f.sealNo} onChange={set('sealNo')} placeholder="SEG-90100" required /></div>
        <fieldset className="md:col-span-2">
          <legend className="lbl">Ukuran (cm)</legend>
          <div className="grid grid-cols-3 gap-2">
            <input aria-label="Panjang" className="in font-mono" inputMode="decimal" value={f.lengthCm} onChange={set('lengthCm')} placeholder="P" required />
            <input aria-label="Lebar" className="in font-mono" inputMode="decimal" value={f.widthCm} onChange={set('widthCm')} placeholder="L" required />
            <input aria-label="Tinggi" className="in font-mono" inputMode="decimal" value={f.heightCm} onChange={set('heightCm')} placeholder="T" required />
          </div>
        </fieldset>
      </div>
      <Button type="submit" icon="scan" disabled={busy} className="self-start">{busy ? 'Membandingkan…' : 'Simpan & bandingkan'}</Button>
      {error && <Banner tone="er" icon="alert" role="alert"><p className="text-[13px]">{error}</p></Banner>}
      {res &&
        (res.result === 'match' ? (
          <Banner tone="ok" icon="check" role="status"><p><b>Cocok.</b> Identitas paket {res.awb} di {res.hub} sesuai catatan pengambilan. Linimasa pelanggan diperbarui.</p></Banner>
        ) : (
          <Banner tone="er" icon="flag" role="status">
            <div className="flex flex-col gap-1">
              <p><b>Tidak cocok:</b> {res.diffs.join(', ')} berbeda dari catatan pengambilan.</p>
              {res.isFirstMismatch && <p className="text-[13px]">Ditandai sebagai ketidakcocokan pertama. Anomali tingkat Tinggi dibuat di antrean.</p>}
              <Link className="lnk text-[13px]" href={`/lacak/${res.awb}`}>Lihat linimasa paket</Link>
            </div>
          </Banner>
        ))}
    </form>
  )
}
