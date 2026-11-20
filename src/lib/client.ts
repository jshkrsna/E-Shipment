'use client'

/** fetch JSON dengan pesan error berbahasa Indonesia dari API. */
export async function api<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error || `Permintaan gagal (${res.status}).`)
  return data as T
}

/** PUT berkas dengan progres (XHR, karena fetch belum mendukung progres unggah). */
export function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    if (!headers['content-type']) xhr.setRequestHeader('content-type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Unggah gagal (${xhr.status}).`)))
    xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah.'))
    xhr.send(file)
  })
}

export function videoDuration(file: File) {
  return new Promise<number | undefined>((resolve) => {
    if (!file.type.startsWith('video/')) return resolve(undefined)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : undefined)
    }
    v.onerror = () => resolve(undefined)
    v.src = URL.createObjectURL(file)
  })
}
