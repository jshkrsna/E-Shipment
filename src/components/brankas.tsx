'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, fileMime, putWithProgress, videoDuration } from '@/lib/client'
import { duration, fileSize, fmtDateTime } from '@/lib/format'
import { Icon } from './icon'
import { Modal } from './modal'
import { Banner, Button, Chip, ProgressBar, btnClass, cx } from './ui'

export type VaultFile = {
  id: number
  fileName: string
  mediaType: string
  source: 'device' | 'google_drive' | 'courier' | 'link'
  /** Tautan eksternal (GDrive, OneDrive, dll.) bila mediaType = link. */
  url: string | null
  provider: string | null
  size: number | null
  durationSec: number | null
  locked: boolean
  hasFile: boolean
  createdAt: string
}

type Upload = { name: string; pct: number; error?: string }

const SOURCE = { device: 'Perangkat', google_drive: 'Google Drive', courier: 'Kurir', link: 'Tautan' } as const
const kindLabel = (f: VaultFile) => (f.mediaType === 'link' ? 'Tautan' : f.mediaType === 'video' ? 'Video' : 'Foto')
const sourceLabel = (f: VaultFile) => (f.mediaType === 'link' ? f.provider || 'Tautan' : SOURCE[f.source])

function Thumb({ f, className, controls = false }: { f: VaultFile; className?: string; controls?: boolean }) {
  if (f.mediaType === 'link') {
    return (
      <div className={cx('ph flex-col gap-2 px-4 text-center', controls && 'w-full max-w-md bg-white', className)}>
        <span className="grid size-12 place-items-center rounded-full bg-white text-navy"><Icon name="link" size={22} /></span>
        <span className="font-semibold text-txt">{f.fileName}</span>
        <span className="text-[13px] font-normal">{f.provider || 'Tautan eksternal'}</span>
        {controls && f.url && (
          <a href={f.url} target="_blank" rel="noopener noreferrer nofollow" className={btnClass('primary', 'mt-1')}>
            <Icon name="external" size={18} />Buka tautan
          </a>
        )}
        {controls && f.url && <span className="max-w-full truncate font-mono text-[11px] font-normal">{f.url}</span>}
      </div>
    )
  }
  if (!f.hasFile) {
    return (
      <div className={cx('ph flex-col gap-1', className)}>
        <span className="rounded-full bg-white px-2 py-0.5 text-[13px] font-semibold text-nu">{kindLabel(f)}</span>
        <span className="px-2 text-[13px]">{f.fileName}</span>
        <span className="text-[11px] font-normal">Berkas tidak tersedia</span>
      </div>
    )
  }
  const src = `/api/evidence/${f.id}/file`
  if (f.mediaType === 'video') {
    return <video src={src} className={cx('bg-black object-contain', className)} preload="metadata" controls={controls} playsInline muted={!controls} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={f.fileName} className={cx('bg-nu-bg object-cover', className)} loading="lazy" />
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any
    google?: any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Gagal memuat Google API'))
    document.head.appendChild(s)
  })
}

export function Brankas({ awb, files, canEdit }: { awb: string; files: VaultFile[]; canEdit: boolean }) {
  const router = useRouter()
  const [index, setIndex] = useState(Math.max(0, files.length - 1))
  const [sheet, setSheet] = useState(false)
  const [preview, setPreview] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState({ name: '', url: '' })
  const [linkError, setLinkError] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevCount = useRef(files.length)
  const driveClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const driveApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  // Nomor project GCP: wajib untuk scope drive.file agar berkas yang dipilih bisa diunduh server.
  const driveAppId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID
  const driveEnabled = !!(driveClientId && driveApiKey && driveAppId)

  useEffect(() => {
    // Saat berkas bertambah, tampilkan berkas terbaru; saat berkurang, jaga indeks tetap valid.
    if (files.length > prevCount.current) setIndex(files.length - 1)
    else setIndex((i) => Math.min(i, Math.max(0, files.length - 1)))
    prevCount.current = files.length
  }, [files.length])

  const cur = files[index]
  const go = useCallback((d: number) => files.length && setIndex((i) => (i + d + files.length) % files.length), [files.length])

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview, go])

  async function uploadDeviceFiles(list: FileList | null) {
    if (!list?.length) return
    setSheet(false)
    setError('')
    const arr = Array.from(list)
    setUploads(arr.map((f) => ({ name: f.name, pct: 0 })))
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      const update = (u: Partial<Upload>) => setUploads((prev) => prev.map((p, j) => (j === i ? { ...p, ...u } : p)))
      try {
        const meta = { awb, fileName: file.name, mime: fileMime(file), size: file.size }
        const target = await api<{ key: string; uploadUrl: string; headers: Record<string, string> }>('/api/evidence/upload-url', { method: 'POST', json: meta })
        await putWithProgress(target.uploadUrl, file, target.headers, (pct) => update({ pct }))
        await api('/api/evidence', { method: 'POST', json: { ...meta, key: target.key, durationSec: await videoDuration(file) } })
        update({ pct: 100 })
      } catch (e) {
        update({ error: (e as Error).message })
      }
    }
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
    setTimeout(() => setUploads((u) => u.filter((x) => x.error)), 1200)
  }

  async function pickFromDrive() {
    if (!driveEnabled) return
    setError('')
    try {
      await Promise.all([loadScript('https://apis.google.com/js/api.js'), loadScript('https://accounts.google.com/gsi/client')])
      await new Promise<void>((r) => window.gapi.load('picker', () => r()))
      const g = window.google
      const tokenClient = g.accounts.oauth2.initTokenClient({
        client_id: driveClientId!,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp: { access_token?: string }) => {
          if (!resp.access_token) return setError('Izin Google Drive tidak diberikan.')
          const token = resp.access_token
          const view = new g.picker.DocsView()
          view.setMimeTypes('image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm')
          view.setIncludeFolders(true)
          const picker = new g.picker.PickerBuilder()
            .addView(view)
            .enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(token)
            .setDeveloperKey(driveApiKey)
            .setAppId(driveAppId)
            .setCallback(async (data: { action: string; docs?: { id: string; name: string }[] }) => {
              if (data.action !== g.picker.Action.PICKED || !data.docs) return
              setUploads(data.docs.map((d) => ({ name: d.name, pct: 10 })))
              for (let i = 0; i < data.docs.length; i++) {
                try {
                  await api('/api/evidence/drive', { method: 'POST', json: { awb, fileId: data.docs[i].id, accessToken: token } })
                  setUploads((p) => p.map((u, j) => (j === i ? { ...u, pct: 100 } : u)))
                } catch (e) {
                  setUploads((p) => p.map((u, j) => (j === i ? { ...u, error: (e as Error).message } : u)))
                }
              }
              router.refresh()
              setTimeout(() => setUploads((u) => u.filter((x) => x.error)), 1200)
            })
            .build()
          picker.setVisible(true)
        },
      })
      setSheet(false)
      tokenClient.requestAccessToken()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError('')
    const name = link.name.trim()
    const url = link.url.trim()
    if (!name) return setLinkError('Nama tautan wajib diisi.')
    if (!/^https:\/\/\S+$/i.test(url)) return setLinkError('Tempel tautan lengkap yang diawali https://')
    setLinkBusy(true)
    try {
      await api('/api/evidence/link', { method: 'POST', json: { awb, name, url } })
      setLink({ name: '', url: '' })
      setLinkOpen(false)
      router.refresh()
    } catch (err) {
      setLinkError((err as Error).message)
    } finally {
      setLinkBusy(false)
    }
  }

  async function remove() {
    if (!cur) return
    setBusy(true)
    try {
      await api(`/api/evidence/${cur.id}`, { method: 'DELETE' })
      setConfirmDel(false)
      setPreview(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
      setConfirmDel(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Brankas unboxing">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-semibold">Brankas unboxing</h2>
        <Chip tone="nu">Ditambahkan oleh Anda</Chip>
      </div>
      <div className="card flex flex-col gap-3">
        {canEdit && (
          <Button icon="upload" onClick={() => setSheet(true)} className="w-full">Upload File</Button>
        )}
        {canEdit && !linkOpen && (
          <Button variant="secondary" icon="link" onClick={() => setLinkOpen(true)} className="w-full">Tambahkan link (Google Drive, OneDrive, dll.)</Button>
        )}
        {canEdit && linkOpen && (
          <form onSubmit={addLink} className="flex flex-col gap-3 rounded-r border border-line p-4" noValidate>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold"><Icon name="link" size={18} className="text-navy" />Tambahkan link</span>
              <button type="button" onClick={() => { setLinkOpen(false); setLinkError('') }} className="grid size-9 place-items-center rounded-r text-mut hover:bg-nu-bg" aria-label="Tutup form link"><Icon name="x" size={18} /></button>
            </div>
            <div>
              <label className="lbl" htmlFor="link-name">Nama link</label>
              <input id="link-name" className="in" value={link.name} onChange={(e) => setLink((l) => ({ ...l, name: e.target.value }))} placeholder="Contoh: Video unboxing lengkap" maxLength={120} autoFocus />
            </div>
            <div>
              <label className="lbl" htmlFor="link-url">Link</label>
              <input id="link-url" type="url" inputMode="url" className="in" value={link.url} onChange={(e) => setLink((l) => ({ ...l, url: e.target.value }))} placeholder="https://drive.google.com/… atau https://1drv.ms/…" autoComplete="off" />
            </div>
            {linkError && <p className="text-[13px] font-semibold text-er" role="alert">{linkError}</p>}
            <Button type="submit" icon="plus" disabled={linkBusy}>{linkBusy ? 'Menyimpan…' : 'Simpan link'}</Button>
            <p className="hint">Atur akses link ke &ldquo;Siapa saja yang memiliki link&rdquo; agar admin dapat membukanya. Link disimpan apa adanya tanpa cap integritas.</p>
          </form>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => uploadDeviceFiles(e.target.files)} />

        {uploads.length > 0 && (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {uploads.map((u, i) => (
              <li key={i} className="flex flex-col gap-1">
                <div className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate">{u.error ? `Gagal: ${u.name}` : `Mengunggah ${u.name}`}</span>
                  <span className="font-mono">{u.error ? '' : `${u.pct}%`}</span>
                </div>
                {u.error ? <p className="text-[13px] font-semibold text-er">{u.error}</p> : <ProgressBar value={u.pct} label={`Progres ${u.name}`} />}
              </li>
            ))}
          </ul>
        )}

        {files.length === 0 ? (
          <div className="ph h-40 flex-col gap-1 font-normal">
            <Icon name="image" size={28} />
            <span className="font-semibold">Belum ada foto atau video unboxing</span>
            <span className="text-[13px]">{canEdit ? 'Unggah berkas, atau tambahkan link Google Drive/OneDrive.' : 'Pemilik paket belum menambahkan berkas.'}</span>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-r border border-line">
              <button type="button" onClick={() => setPreview(true)} className="block w-full" aria-label={`Buka preview ${cur?.fileName}`}>
                {cur && <Thumb key={cur.id} f={cur} className="aspect-[4/3] w-full md:aspect-auto md:h-[360px]" />}
              </button>
              {files.length > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Berkas sebelumnya" className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow">
                    <Icon name="left" size={22} />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Berkas berikutnya" className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow">
                    <Icon name="right" size={22} />
                  </button>
                </>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-nu" aria-live="polite">{index + 1} / {files.length}</span>
            </div>

            {cur && (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{cur.fileName}</p>
                  <p className="text-[13px] text-mut">
                    {[kindLabel(cur), sourceLabel(cur), cur.durationSec ? duration(cur.durationSec) : '', fileSize(cur.size)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <Button variant="secondary" icon="eye" onClick={() => setPreview(true)}>Preview</Button>
                {canEdit && (
                  <Button
                    variant="danger"
                    className="w-11 px-0"
                    aria-label={cur.locked ? 'Berkas terkunci, tidak dapat dihapus' : `Hapus ${cur.fileName}`}
                    title={cur.locked ? 'Sudah dilampirkan pada laporan, tidak dapat dihapus' : 'Hapus berkas'}
                    disabled={cur.locked}
                    onClick={() => setConfirmDel(true)}
                  >
                    <Icon name={cur.locked ? 'lock' : 'trash'} size={18} />
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Thumbnail berkas">
              {files.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => setIndex(i)}
                  className={cx('relative size-16 shrink-0 overflow-hidden rounded-r border-2 md:size-20', i === index ? 'border-navy' : 'border-transparent')}
                >
                  {f.hasFile && f.mediaType === 'image' ? (
                    <Thumb f={f} className="size-full" />
                  ) : (
                    <span className="grid size-full place-items-center bg-nu-bg text-[13px] font-semibold text-nu">
                      {f.mediaType === 'link' ? <span className="flex flex-col items-center gap-0.5"><Icon name="link" size={18} />Tautan</span> : kindLabel(f)}
                    </span>
                  )}
                  {f.locked && <span className="absolute top-1 right-1 rounded-full bg-white p-0.5 text-ok"><Icon name="lock" size={12} /></span>}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="stamp"><Icon name="shield" size={16} />{files.length} berkas · tidak dapat diubah setelah dilaporkan</p>
        {error && <Banner tone="er" icon="alert"><p className="text-[13px]">{error}</p></Banner>}
      </div>

      {/* Pilih sumber */}
      <Modal open={sheet} onClose={() => setSheet(false)} title="Upload dari mana?">
        <div className="flex flex-col gap-2 p-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-16 items-center gap-3 rounded-r border border-line-d px-4 text-left hover:bg-nb-bg">
            <span className="grid size-10 place-items-center rounded-full bg-nb-bg text-navy"><Icon name="device" size={20} /></span>
            <span className="flex flex-col"><b>Perangkat</b><span className="text-[13px] text-mut">Galeri, kamera, atau berkas · foto & video maks 50 MB</span></span>
          </button>
          <button
            type="button"
            onClick={pickFromDrive}
            disabled={!driveEnabled}
            className="flex min-h-16 items-center gap-3 rounded-r border border-line-d px-4 text-left enabled:hover:bg-nb-bg disabled:opacity-60"
          >
            <span className="grid size-10 place-items-center rounded-full bg-ok-bg text-ok"><Icon name="drive" size={20} /></span>
            <span className="flex flex-col">
              <b>Google Drive</b>
              <span className="text-[13px] text-mut">{driveEnabled ? 'Pilih foto atau video dari Drive Anda' : 'Belum dikonfigurasi oleh pengelola situs'}</span>
            </span>
          </button>
          <p className="hint mt-1">Berkas mendapat cap integritas (SHA-256) saat disimpan dan terkunci setelah dilampirkan pada laporan.</p>
        </div>
      </Modal>

      {/* Preview layar penuh */}
      {preview && cur && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#0B1220]" role="dialog" aria-modal="true" aria-label={`Preview ${cur.fileName}`}>
          <div className="flex min-h-14 items-center gap-3 px-4 text-white">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{cur.fileName}</p>
              <p className="text-[13px] text-[#9FB3D6]">{index + 1} / {files.length} · {sourceLabel(cur)} · ditambahkan {fmtDateTime(cur.createdAt)}</p>
            </div>
            {canEdit && !cur.locked && (
              <button type="button" onClick={() => setConfirmDel(true)} className="grid size-11 place-items-center rounded-r text-[#FFB4AB] hover:bg-white/10" aria-label="Hapus berkas"><Icon name="trash" size={20} /></button>
            )}
            <button type="button" onClick={() => setPreview(false)} className="grid size-11 place-items-center rounded-r hover:bg-white/10" aria-label="Tutup preview" autoFocus><Icon name="x" size={22} /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-2 md:p-8">
            <Thumb key={cur.id} f={cur} className="max-h-full max-w-full rounded-r object-contain" controls />
            {files.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-3 grid size-12 place-items-center rounded-full bg-white/90 text-navy" aria-label="Sebelumnya"><Icon name="left" size={24} /></button>
                <button type="button" onClick={() => go(1)} className="absolute right-3 grid size-12 place-items-center rounded-full bg-white/90 text-navy" aria-label="Berikutnya"><Icon name="right" size={24} /></button>
              </>
            )}
          </div>
          <p className="px-4 pb-4 text-center text-[13px] text-[#9FB3D6]">{cur.locked ? 'Terkunci: sudah dilampirkan pada laporan.' : 'Belum dilaporkan: masih dapat dihapus.'}</p>
        </div>
      )}

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Hapus berkas?" variant="center">
        <div className="flex flex-col gap-4 p-4">
          <p>Berkas <b>{cur?.fileName}</b> akan dihapus dari brankas. Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDel(false)}>Batal</Button>
            <Button variant="danger" icon="trash" onClick={remove} disabled={busy}>{busy ? 'Menghapus…' : 'Hapus'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
