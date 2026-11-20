'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/client'
import { fmtRelativeDay } from '@/lib/format'
import { QUICK_REPLIES } from '@/lib/labels'
import { Icon } from './icon'
import { Button, cx } from './ui'

export type ChatMessage = { id: number; senderRole: 'pelapor' | 'admin' | 'sistem'; kind: string; body: string; createdAt: string }

export function CaseChat({
  code, initial, viewer, reporterLabel, closed, className, onActivity,
}: {
  code: string
  initial: ChatMessage[]
  viewer: 'pelapor' | 'admin'
  reporterLabel: string
  closed?: boolean
  className?: string
  onActivity?: () => void
}) {
  const [messages, setMessages] = useState(initial)
  const [draft, setDraft] = useState(viewer === 'admin' ? QUICK_REPLIES[0].text : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const lastId = messages.at(-1)?.id ?? 0

  useEffect(() => setMessages(initial), [initial])

  // Polling ringan agar balasan pihak lain muncul tanpa memuat ulang.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return
      try {
        const r = await api<{ messages: ChatMessage[] }>(`/api/cases/${code}/messages?after=${lastId}`)
        if (r.messages.length) {
          setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))])
          onActivity?.()
        }
      } catch {
        /* abaikan, coba lagi berikutnya */
      }
    }, 5000)
    return () => clearInterval(t)
  }, [code, lastId, onActivity])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!draft.trim()) return
    setBusy(true)
    setError('')
    try {
      const { message } = await api<{ message: ChatMessage }>(`/api/cases/${code}/messages`, { method: 'POST', json: { body: draft } })
      setMessages((m) => [...m, message])
      setDraft('')
      onActivity?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={cx('flex min-h-0 flex-col', className)} aria-label="Percakapan">
      <div className="flex min-h-14 items-center border-b border-line px-4">
        <h2 className="text-[16px] font-bold">{viewer === 'admin' ? 'Percakapan dengan pelapor' : 'Percakapan dengan admin ekspedisi'}</h2>
      </div>
      <div ref={listRef} className="flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => {
          if (m.senderRole === 'sistem') {
            return (
              <p key={m.id} className="mx-auto max-w-[90%] rounded-full bg-nu-bg px-3 py-1 text-center text-[12px] text-nu">
                {m.body} · {fmtRelativeDay(m.createdAt)}
              </p>
            )
          }
          const mine = m.senderRole === viewer
          const who = m.senderRole === 'pelapor' ? (viewer === 'pelapor' ? 'Anda' : `Pelapor ${reporterLabel}`) : viewer === 'admin' ? 'Anda (admin)' : 'Admin ekspedisi'
          return (
            <div key={m.id} className={cx('flex max-w-[85%] flex-col gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
              <span className="text-[12px] text-mut">{who} · {fmtRelativeDay(m.createdAt)}</span>
              <div
                className={cx(
                  'rounded-[12px] px-3.5 py-2.5 whitespace-pre-line',
                  m.kind === 'keputusan' ? 'border-2 border-ok bg-ok-bg' : mine ? 'bg-navy text-white' : 'bg-nb-bg',
                )}
              >
                {m.kind === 'keputusan' && <span className="mb-1 flex items-center gap-1 text-[12px] font-bold text-ok"><Icon name="check" size={14} />Keputusan</span>}
                {m.body}
              </div>
            </div>
          )
        })}
      </div>
      {closed ? (
        <p className="border-t border-line p-4 text-center text-[13px] text-mut">Kasus sudah ditutup. Percakapan hanya dapat dibaca.</p>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-2 border-t border-line p-4">
          {viewer === 'admin' && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Template balasan">
              {QUICK_REPLIES.map((q) => (
                <button key={q.label} type="button" onClick={() => setDraft(q.text)} className="min-h-9 rounded-full border border-line-d px-3 text-[13px] font-semibold text-nu hover:bg-nu-bg">
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <label htmlFor={`reply-${code}`} className="lbl !mb-0">{viewer === 'admin' ? 'Reply pelapor' : 'Tulis pesan'}</label>
          <textarea
            id={`reply-${code}`}
            rows={3}
            className="in resize-y"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send()
            }}
            placeholder={viewer === 'admin' ? 'Tulis balasan untuk pelapor' : 'Tambahkan informasi untuk admin'}
          />
          {error && <p className="text-[12px] font-semibold text-er" role="alert">{error}</p>}
          <Button type="submit" icon="send" disabled={busy || !draft.trim()}>{busy ? 'Mengirim…' : viewer === 'admin' ? 'Kirim reply' : 'Kirim pesan'}</Button>
        </form>
      )}
    </section>
  )
}
