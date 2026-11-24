'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { CATEGORY_OPTIONS, type CategoryValue } from '@/lib/labels'
import { Icon } from './icon'
import { RichEditor } from './rich-editor'
import { Banner, Button, Chip, cx } from './ui'

export type ReportEvidence = { id: number; label: string; owner: 'user' | 'courier' }

export function ReportForm({ awb, evidence, defaultCategory }: { awb: string; evidence: ReportEvidence[]; defaultCategory?: CategoryValue }) {
  const router = useRouter()
  const [category, setCategory] = useState<CategoryValue | null>(defaultCategory ?? null)
  const [other, setOther] = useState('')
  const [story, setStory] = useState({ html: '', text: '' })
  const [picked, setPicked] = useState<number[]>(evidence.map((e) => e.id))
  const [contact, setContact] = useState<'whatsapp' | 'email'>('whatsapp')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const otherMissing = category === 'LAINNYA' && !other.trim()
  const storyMissing = story.text.length < 10
  const canSubmit = !!category && !otherMissing && !storyMissing && !busy

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError('')
    try {
      const { code } = await api<{ code: string }>('/api/cases', {
        method: 'POST',
        json: { awb, category, categoryOther: category === 'LAINNYA' ? other : null, storyHtml: story.html, evidenceIds: picked, contactChannel: contact },
      })
      router.push(`/kasus/${code}?baru=1`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Banner tone="nb" icon="info"><p className="text-[13px]">Laporan Anda membuka kasus. Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.</p></Banner>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="lbl">Apa masalahnya?</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {CATEGORY_OPTIONS.map((o) => (
            <label key={o.value} className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-r px-3 py-2', category === o.value ? 'border border-navy bg-nb-bg/60 shadow-[inset_0_0_0_1px_var(--color-navy)]' : 'border border-line-d bg-white transition-colors hover:border-navy/50', o.value === 'LAINNYA' && category === 'LAINNYA' && 'md:col-span-2')}>
              <input type="radio" name="kat" value={o.value} checked={category === o.value} onChange={() => setCategory(o.value)} className="size-5 accent-navy" />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {category === 'LAINNYA' && (
          <div className="flex flex-col gap-1">
            <label htmlFor="lainnya" className="lbl !mb-0">Jelaskan masalah lainnya <span className="text-er">*</span></label>
            <input
              id="lainnya"
              className={cx('in', otherMissing && 'border-er')}
              value={other}
              onChange={(e) => setOther(e.target.value)}
              maxLength={200}
              placeholder="Contoh: kemasan basah"
              aria-invalid={otherMissing}
              aria-describedby="lainnya-h"
              autoFocus
            />
            <p id="lainnya-h" className={cx('text-[13px]', otherMissing ? 'font-semibold text-er' : 'text-mut')}>
              {otherMissing ? 'Wajib diisi. Laporan tidak dapat dikirim selama kolom ini kosong.' : `${other.length}/200 karakter`}
            </p>
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="lbl !mb-0" htmlFor="cerita">Cerita singkat</label>
        <RichEditor id="cerita" placeholder="Tulis apa yang Anda terima dan kapan." onChange={(html, text) => setStory({ html, text })} describedBy="cerita-h" />
        <p id="cerita-h" className="hint">Gunakan tebal, miring, garis bawah, atau daftar. Jangan masukkan data pribadi lain. {storyMissing && story.text.length > 0 && <b className="text-er">Minimal 10 karakter.</b>}</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="lbl !mb-0">Bukti dari brankas Anda</span>
        {evidence.length === 0 ? (
          <p className="note">Belum ada bukti. Anda dapat menambah foto/video di tab Bukti sebelum melapor.</p>
        ) : (
          evidence.map((e) => (
            <label key={e.id} className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-r px-3 py-2', picked.includes(e.id) ? 'border border-navy bg-nb-bg/60 shadow-[inset_0_0_0_1px_var(--color-navy)]' : 'border border-line-d bg-white transition-colors hover:border-navy/50')}>
              <input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} className="size-5 accent-navy" />
              <span className="min-w-0 grow truncate">{e.label}</span>
              {e.owner === 'user' ? <Chip tone="nu">Oleh Anda</Chip> : <Chip tone="nb">Dicatat kurir</Chip>}
            </label>
          ))
        )}
        <p className="hint">Bukti terisi otomatis. Hapus centang bila tidak ingin melampirkan. Berkas yang dilampirkan akan dikunci.</p>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="lbl">Hubungi saya lewat</legend>
        <div className="flex gap-2">
          {(['whatsapp', 'email'] as const).map((c) => (
            <label key={c} className={cx('flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-r px-3', contact === c ? 'border border-navy bg-nb-bg/60 shadow-[inset_0_0_0_1px_var(--color-navy)]' : 'border border-line-d bg-white transition-colors hover:border-navy/50')}>
              <input type="radio" name="kontak" checked={contact === c} onChange={() => setContact(c)} className="size-5 accent-navy" />
              <span>{c === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Banner tone="er" icon="alert" role="alert"><p className="text-[13px]">{error}</p></Banner>}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-white px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <Button type="submit" disabled={!canSubmit} className="w-full md:w-auto md:min-w-56">
          {busy ? 'Mengirim…' : <><Icon name="send" size={18} />Kirim laporan</>}
        </Button>
        {!canSubmit && !busy && (
          <p className="mt-2 text-[13px] text-mut">{!category ? 'Pilih jenis masalah.' : otherMissing ? 'Isi kolom Lainnya terlebih dahulu.' : storyMissing ? 'Tulis cerita singkat minimal 10 karakter.' : ''}</p>
        )}
      </div>
    </form>
  )
}
