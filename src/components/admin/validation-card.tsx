'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { api } from '@/lib/client'
import { fmtDateTime, rupiah } from '@/lib/format'
import { computeCharge, isComplete, summaryLines, type Rule, type TraceLoc, type ValidationState } from '@/lib/validation'
import { Icon } from '../icon'
import { Modal } from '../modal'
import { Banner, Button, Chip, ProgressBar, cx } from '../ui'

function YesNo({ value, onChange, disabled, label }: { value: boolean | null; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-r border border-line-d" role="radiogroup" aria-label={label}>
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={cx('min-h-11 min-w-16 px-4 font-semibold', v ? 'border-r border-line-d' : '', value === v ? 'bg-navy text-white' : 'bg-white text-txt hover:bg-nu-bg disabled:hover:bg-white')}
        >
          {v ? 'Ya' : 'Tidak'}
        </button>
      ))}
    </div>
  )
}

const TRACE_CHIP = {
  belum: { tone: 'wn' as const, icon: 'clock' as const, label: 'Belum diperiksa' },
  tidak_ada: { tone: 'nu' as const, icon: 'x' as const, label: 'Tidak ditemukan' },
  ditemukan: { tone: 'ok' as const, icon: 'check' as const, label: 'Paket ditemukan' },
}

export function ValidationCard({
  code, initial, rules, trace, itemValue, status, decisionSentAt, redeliveryAt,
}: {
  code: string
  initial: ValidationState
  rules: Rule[]
  trace: TraceLoc[]
  itemValue: number
  status: 'BARU' | 'DIPROSES' | 'PENYEBAB_DITEMUKAN' | 'SELESAI'
  decisionSentAt: string | null
  redeliveryAt: string | null
}) {
  const router = useRouter()
  const [v, setV] = useState<ValidationState>(initial)
  const [manualText, setManualText] = useState(initial.chargeManual ? String(initial.chargeManual) : '')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [closeOpen, setCloseOpen] = useState(false)
  const [cause, setCause] = useState('')
  const [redeliveryDate, setRedeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 86400_000)
    d.setHours(10, 0, 0, 0)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })

  const locked = status === 'BARU' || status === 'SELESAI'
  const charge = useMemo(() => (v.damaged && v.insurance === 'tanpa_asuransi' ? computeCharge(v, rules, itemValue) : null), [v, rules, itemValue])
  const complete = isComplete(v, charge, trace)
  const lines = summaryLines(v, charge, trace, redeliveryAt ? fmtDateTime(redeliveryAt) : null)
  const checked = trace.filter((t) => t.status !== 'belum').length
  const found = trace.find((t) => t.status === 'ditemukan')

  // Simpan berurutan: klik cepat tidak boleh menghasilkan PUT yang tiba tidak urut.
  const latest = useRef(v)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const pending = useRef(0)
  function save(next: ValidationState) {
    setV(next)
    latest.current = next
    setError('')
    setOk('')
    setBusy('save')
    pending.current++
    queue.current = queue.current.then(async () => {
      try {
        await api(`/api/admin/cases/${code}/validation`, { method: 'PUT', json: latest.current })
      } catch (e) {
        setError((e as Error).message)
      } finally {
        if (--pending.current === 0) {
          setBusy(null)
          router.refresh()
        }
      }
    })
    return queue.current
  }

  async function act(key: string, url: string, init: RequestInit & { json?: unknown }, success: string) {
    await queue.current
    setBusy(key)
    setError('')
    setOk('')
    try {
      await api(url, init)
      setOk(success)
      router.refresh()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="card relative flex flex-col gap-4" aria-label="Validasi laporan">
      <div>
        <h2 className="text-[18px] font-bold">Validasi laporan</h2>
        <p className="text-[12px] text-mut">Jawab dua pertanyaan. Pilihan berikutnya muncul sesuai jawaban.</p>
      </div>
      {status === 'BARU' && <Banner tone="wn" icon="lock"><p className="text-[13px]">Terima laporan terlebih dahulu untuk mulai memvalidasi.</p></Banner>}

      {/* Barang rusak */}
      <div className="flex flex-col gap-3 rounded-r border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">Apakah barang rusak?</span>
          <YesNo label="Apakah barang rusak?" value={v.damaged} disabled={locked} onChange={(d) => save({ ...v, damaged: d, insurance: d ? v.insurance : null, chargeRuleId: d ? v.chargeRuleId : null, chargeManual: d ? v.chargeManual : null })} />
        </div>
        {v.damaged && (
          <fieldset className="flex flex-col gap-2" disabled={locked}>
            <legend className="mb-2 text-[13px] text-mut">Keputusan penggantian</legend>
            {(['asuransi', 'tanpa_asuransi'] as const).map((opt) => (
              <label key={opt} className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-r px-3', v.insurance === opt ? 'border-2 border-navy bg-nb-bg' : 'border border-line-d bg-white')}>
                <input type="radio" name={`ins-${code}`} className="size-5 accent-navy" checked={v.insurance === opt} onChange={() => save({ ...v, insurance: opt, chargeRuleId: opt === 'tanpa_asuransi' ? (v.chargeRuleId ?? rules[0]?.id ?? null) : null })} />
                {opt === 'asuransi' ? 'Pihak terkait mengganti dengan asuransi' : 'Pihak terkait tidak mengganti dengan asuransi'}
              </label>
            ))}
            {v.insurance === 'tanpa_asuransi' && (
              <div className="mt-1 flex flex-col gap-3 rounded-r bg-wn-bg p-4">
                <span className="font-semibold">Charge sesuai ketentuan yang berlaku</span>
                <div>
                  <label className="lbl" htmlFor={`rule-${code}`}>Dasar ketentuan</label>
                  <select id={`rule-${code}`} className="in" value={v.chargeRuleId ?? ''} onChange={(e) => save({ ...v, chargeRuleId: Number(e.target.value) || null })}>
                    {rules.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor={`manual-${code}`}>Penyesuaian manual (Rp), kosongkan untuk memakai hitungan ketentuan</label>
                  <input
                    id={`manual-${code}`}
                    className="in font-mono"
                    inputMode="numeric"
                    placeholder="Contoh: 150000"
                    value={manualText}
                    onChange={(e) => {
                      const t = e.target.value.replace(/\D/g, '')
                      setManualText(t)
                      setV((x) => ({ ...x, chargeManual: t ? Number(t) : null }))
                    }}
                    onBlur={() => save({ ...v, chargeManual: manualText ? Number(manualText) : null })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Total charge</span>
                  <b className="font-mono text-[22px]" aria-live="polite">{rupiah(charge ?? 0)}</b>
                </div>
                <p className="text-[12px] text-mut">Nilai barang {rupiah(itemValue)}. Persentase mengikuti ketentuan charge yang berlaku.</p>
              </div>
            )}
          </fieldset>
        )}
      </div>

      {/* Barang tertukar */}
      <div className="flex flex-col gap-3 rounded-r border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">Apakah barang tertukar?</span>
          <YesNo label="Apakah barang tertukar?" value={v.swapped} disabled={locked} onChange={(s) => save({ ...v, swapped: s })} />
        </div>
        {v.swapped && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Pelacakan hingga paket ditemukan</span>
              <span className="text-[12px] text-mut">{checked} dari {trace.length} lokasi diperiksa</span>
            </div>
            <ProgressBar value={trace.length ? (found ? 100 : (checked / trace.length) * 100) : 0} tone={found ? 'ok' : 'navy'} label="Progres pelacakan" />
            {found && (
              <div className="flex flex-col gap-2 rounded-r border border-ok/40 bg-ok-bg p-4">
                <span className="flex items-center gap-2 font-semibold"><Icon name="check" size={18} className="text-ok" />Paket ditemukan di {found.name}</span>
                <p className="text-[13px] text-mut">Pelacakan selesai. Anda dapat menjadwalkan pengiriman ulang ke penerima.</p>
                {redeliveryAt ? (
                  <Chip tone="ok" icon="calendar" className="self-start">Dijadwalkan {fmtDateTime(redeliveryAt)}</Chip>
                ) : (
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label htmlFor={`rd-${code}`} className="lbl">Tanggal pengiriman ulang</label>
                      <input id={`rd-${code}`} type="datetime-local" className="in" value={redeliveryDate} onChange={(e) => setRedeliveryDate(e.target.value)} disabled={locked} />
                    </div>
                    <Button variant="secondary" icon="calendar" disabled={locked || busy === 'rd'} onClick={() => act('rd', `/api/admin/cases/${code}/redelivery`, { method: 'POST', json: { date: new Date(redeliveryDate).toISOString() } }, 'Pengiriman ulang dijadwalkan.')}>
                      Jadwalkan pengiriman ulang
                    </Button>
                  </div>
                )}
              </div>
            )}
            {trace.length === 0 && <p className="hint">Menyiapkan daftar lokasi…</p>}
            <ul className="flex flex-col divide-y divide-line rounded-r border border-line">
              {trace.map((t) => {
                const chip = TRACE_CHIP[t.status]
                return (
                  <li key={t.id} className={cx('flex flex-col gap-2 p-3', t.status === 'ditemukan' && 'bg-ok-bg')}>
                    <span className="font-semibold">{t.name}</span>
                    <Chip tone={chip.tone} icon={chip.icon} className="self-start">{chip.label}</Chip>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ['tidak_ada', 'Tidak ada'],
                          ['ditemukan', 'Ditemukan'],
                          ['belum', 'Atur ulang'],
                        ] as const
                      ).map(([s, label]) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={t.status === s && s !== 'belum' ? 'primary' : 'secondary'}
                          disabled={locked || busy === `t${t.id}` || (s === 'belum' && t.status === 'belum')}
                          aria-pressed={t.status === s}
                          onClick={() => act(`t${t.id}`, `/api/admin/cases/${code}/trace/${t.id}`, { method: 'PUT', json: { status: s } }, `${t.name} diperbarui.`)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Ringkasan */}
      <div className="flex flex-col gap-1">
        <span className="up">Ringkasan keputusan</span>
        {lines.map((l) => <p key={l}>{l}</p>)}
        {decisionSentAt && <p className="text-[12px] font-semibold text-ok">Keputusan dikirim ke pelapor {fmtDateTime(decisionSentAt)}.</p>}
      </div>
      {error && <Banner tone="er" icon="alert" role="alert"><p className="text-[13px]">{error}</p></Banner>}
      {ok && <Banner tone="ok" icon="check" role="status"><p className="text-[13px]">{ok}</p></Banner>}
      {status !== 'SELESAI' && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="send" disabled={!complete || locked || busy !== null} onClick={() => act('dec', `/api/admin/cases/${code}/decision`, { method: 'POST' }, 'Keputusan dikirim ke pelapor.')}>
            Kirim keputusan ke pelapor
          </Button>
          <Button disabled={!complete || locked || busy !== null} onClick={() => setCloseOpen(true)}>Tutup laporan</Button>
        </div>
      )}
      {busy === 'save' && <span className="absolute top-4 right-4 text-[12px] text-mut">Menyimpan…</span>}

      <Modal open={closeOpen} onClose={() => setCloseOpen(false)} title="Tutup laporan?" variant="center">
        <form
          className="flex flex-col gap-3 p-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (await act('close', `/api/admin/cases/${code}/close`, { method: 'POST', json: { cause: cause || undefined } }, 'Laporan ditutup.')) setCloseOpen(false)
          }}
        >
          <p className="text-[13px] text-mut">Ringkasan keputusan dikirim ke pelapor bila belum, status menjadi Selesai, dan anomali paket ditandai selesai.</p>
          <div>
            <label htmlFor={`cause-${code}`} className="lbl">Penyebab terkonfirmasi</label>
            <textarea id={`cause-${code}`} rows={3} className="in" value={cause} onChange={(e) => setCause(e.target.value)} placeholder={lines.join(' ')} />
            <p className="hint mt-1">Kosongkan untuk memakai ringkasan keputusan.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCloseOpen(false)}>Batal</Button>
            <Button type="submit" disabled={busy === 'close'}>{busy === 'close' ? 'Menutup…' : 'Tutup laporan'}</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
