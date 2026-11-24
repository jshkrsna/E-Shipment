'use client'

import { useCallback, useEffect, useState } from 'react'
import { duration, fileSize, fmtDateTime } from '@/lib/format'
import { Icon } from '../icon'
import { Chip, cx } from '../ui'

export type ViewerItem = {
  id: number
  fileName: string
  mediaType: string
  ownerType: 'courier' | 'user'
  kind: string
  hasFile: boolean
  url: string | null
  provider: string | null
  size: number | null
  durationSec: number | null
  sha256: string | null
  createdAt: string
}

const fileSrc = (id: number) => `/api/evidence/${id}/file`
const isMedia = (e: ViewerItem) => e.hasFile && (e.mediaType === 'image' || e.mediaType === 'video')
const courierLabel = (e: ViewerItem) => (e.kind === 'handover' ? 'Bukti serah terima OTP' : e.kind === 'hub_scan' ? e.fileName : 'Bukti pengambilan')

/** Lampiran kasus untuk admin: foto & video pelapor dapat dipratinjau langsung, tautan dibuka di tab baru. */
export function EvidenceViewer({ items }: { items: ViewerItem[] }) {
  const media = items.filter(isMedia)
  const rest = items.filter((e) => !isMedia(e))
  const [open, setOpen] = useState<number | null>(null)
  const cur = open === null ? null : media[open]
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + media.length) % media.length)), [media.length])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, go])

  if (!items.length) return null
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      {media.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-nu">Foto dan video pelapor · klik untuk pratinjau</span>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {media.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group relative block aspect-square w-full overflow-hidden rounded-r border border-line bg-nu-bg focus-visible:outline-2 focus-visible:outline-navy"
                  aria-label={`Pratinjau ${e.mediaType === 'video' ? 'video' : 'foto'} ${e.fileName}`}
                >
                  {e.mediaType === 'video' ? (
                    <>
                      <video src={`${fileSrc(e.id)}#t=0.1`} preload="metadata" muted playsInline className="size-full bg-black object-cover" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-10 place-items-center rounded-full bg-white/90 text-navy"><Icon name="play" size={18} /></span>
                      </span>
                      {e.durationSec ? <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/60 px-1.5 text-[11px] text-white">{duration(e.durationSec)}</span> : null}
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileSrc(e.id)} alt={e.fileName} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rest.length > 0 && (
        <ul className="flex flex-col gap-2 text-[14px]">
          {rest.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2">
              {e.mediaType === 'link' && e.url ? (
                <a className="lnk flex min-w-0 items-center gap-1.5" href={e.url} target="_blank" rel="noopener noreferrer nofollow" title={e.url}>
                  <Icon name="link" size={16} className="shrink-0" />
                  <span className="truncate">{e.fileName}</span>
                  <span className="shrink-0 text-mut">· {e.provider || 'Tautan'}</span>
                  <Icon name="external" size={14} className="shrink-0" />
                </a>
              ) : e.hasFile ? (
                <a className="lnk truncate" href={fileSrc(e.id)} target="_blank" rel="noreferrer">{e.fileName}</a>
              ) : (
                <span className="truncate">{e.ownerType === 'courier' ? courierLabel(e) : `${e.fileName} · berkas tidak tersedia`}</span>
              )}
              <Chip tone={e.ownerType === 'courier' ? 'nb' : 'nu'}>{e.ownerType === 'courier' ? 'Dicatat kurir' : 'Oleh pelapor'}</Chip>
            </li>
          ))}
        </ul>
      )}

      {cur && open !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#0B1220]" role="dialog" aria-modal="true" aria-label={`Pratinjau ${cur.fileName}`}>
          <div className="flex min-h-14 items-center gap-3 px-4 text-white">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{cur.fileName}</p>
              <p className="text-[13px] text-[#9FB3D6]">
                {[`${open + 1} / ${media.length}`, cur.mediaType === 'video' ? 'Video' : 'Foto', cur.durationSec ? duration(cur.durationSec) : '', fileSize(cur.size), `diunggah ${fmtDateTime(cur.createdAt)}`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <a href={fileSrc(cur.id)} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-r hover:bg-white/10" aria-label="Buka berkas asli di tab baru" title="Buka berkas asli"><Icon name="external" size={20} /></a>
            <a href={fileSrc(cur.id)} download={cur.fileName} className="grid size-11 place-items-center rounded-r hover:bg-white/10" aria-label="Unduh berkas" title="Unduh"><Icon name="download" size={20} /></a>
            <button type="button" onClick={() => setOpen(null)} className="grid size-11 place-items-center rounded-r hover:bg-white/10" aria-label="Tutup pratinjau" autoFocus><Icon name="x" size={22} /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-2 md:p-8">
            {cur.mediaType === 'video' ? (
              <video key={cur.id} src={fileSrc(cur.id)} controls autoPlay playsInline className="max-h-full max-w-full rounded-r bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={cur.id} src={fileSrc(cur.id)} alt={cur.fileName} className="max-h-full max-w-full rounded-r object-contain" />
            )}
            {media.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-3 grid size-12 place-items-center rounded-full bg-white/90 text-navy" aria-label="Sebelumnya"><Icon name="left" size={24} /></button>
                <button type="button" onClick={() => go(1)} className="absolute right-3 grid size-12 place-items-center rounded-full bg-white/90 text-navy" aria-label="Berikutnya"><Icon name="right" size={24} /></button>
              </>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-2">
              {media.map((m, i) => (
                <button key={m.id} type="button" onClick={() => setOpen(i)} aria-label={`Lihat ${m.fileName}`} aria-current={i === open} className={cx('size-14 shrink-0 overflow-hidden rounded-r border-2', i === open ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100')}>
                  {m.mediaType === 'video' ? (
                    <span className="grid size-full place-items-center bg-[#1C2A44] text-white"><Icon name="play" size={18} /></span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileSrc(m.id)} alt="" className="size-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
          {cur.sha256 && <p className="truncate px-4 pb-4 text-center font-mono text-[11px] text-[#9FB3D6]">SHA-256 {cur.sha256}</p>}
        </div>
      )}
    </div>
  )
}
