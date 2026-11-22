import 'server-only'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { HttpError } from '../http'

/** Error dari Supabase Storage → 502 dengan pesan yang bisa dibaca, bukan 500 kosong. */
function storageError(action: string, message?: string) {
  console.error(`[storage] ${action}:`, message)
  return new HttpError(502, `Layanan penyimpanan menolak ${action}${message ? ` (${message})` : ''}. Coba lagi atau hubungi admin.`)
}

export interface StorageDriver {
  name: 'local' | 'supabase'
  /** URL tujuan unggah langsung dari browser (PUT, body = isi berkas). */
  createUpload(key: string, mime: string): Promise<{ url: string; headers: Record<string, string> }>
  /** Simpan buffer dari server (impor Google Drive). */
  put(key: string, data: Buffer, mime: string): Promise<void>
  /** Hitung SHA-256 + ukuran berkas yang sudah tersimpan (null bila tidak ada). */
  inspect(key: string): Promise<{ sha256: string; size: number } | null>
  remove(key: string): Promise<void>
  /** Untuk penyajian: path lokal atau URL bertanda tangan. */
  locate(key: string): Promise<{ type: 'file'; path: string } | { type: 'url'; url: string }>
}

const secret = () => process.env.SESSION_SECRET || 'dev-secret-ganti-di-produksi-minimal-32-karakter'

export function signKey(key: string, exp: number) {
  return createHmac('sha256', secret()).update(`${key}:${exp}`).digest('base64url')
}
export function verifyKeySig(key: string, exp: number, sig: string) {
  if (!exp || exp < Date.now()) return false
  const a = Buffer.from(signKey(key, exp))
  const b = Buffer.from(sig || '')
  return a.length === b.length && timingSafeEqual(a, b)
}

// ── Lokal ─────────────────────────────────────────────
const LOCAL_ROOT = path.join(process.cwd(), '.data', 'uploads')
export function localPath(key: string) {
  const p = path.join(LOCAL_ROOT, key)
  if (!p.startsWith(LOCAL_ROOT)) throw new Error('Kunci storage tidak valid')
  return p
}

const localDriver: StorageDriver = {
  name: 'local',
  async createUpload(key) {
    const exp = Date.now() + 15 * 60_000
    const url = `/api/evidence/local-upload?key=${encodeURIComponent(key)}&exp=${exp}&sig=${signKey(key, exp)}`
    return { url, headers: {} }
  },
  async put(key, data) {
    const p = localPath(key)
    await fsp.mkdir(path.dirname(p), { recursive: true })
    await fsp.writeFile(p, data)
  },
  async inspect(key) {
    const p = localPath(key)
    if (!fs.existsSync(p)) return null
    const hash = createHash('sha256')
    let size = 0
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(p)
        .on('data', (c) => { hash.update(c); size += c.length })
        .on('end', () => resolve())
        .on('error', reject)
    })
    return { sha256: hash.digest('hex'), size }
  },
  async remove(key) {
    await fsp.rm(localPath(key), { force: true })
  },
  async locate(key) {
    return { type: 'file', path: localPath(key) }
  },
}

// ── Supabase Storage ─────────────────────────────────
async function supabaseBucket() {
  const { StorageClient } = await import('@supabase/storage-js')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[storage] SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk STORAGE_DRIVER=supabase')
    throw new HttpError(503, 'Penyimpanan berkas bukti belum dikonfigurasi di server. Hubungi admin.')
  }
  // Kunci baru Supabase (sb_secret_…) bukan JWT: cukup dikirim di header apikey.
  // Kunci lama (service_role, JWT) dikirim di apikey + Authorization.
  const headers: Record<string, string> = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
  const client = new StorageClient(`${url.replace(/\/$/, '')}/storage/v1`, headers)
  return client.from(process.env.SUPABASE_BUCKET || 'evidence')
}

const supabaseDriver: StorageDriver = {
  name: 'supabase',
  async createUpload(key, mime) {
    const bucket = await supabaseBucket()
    const { data, error } = await bucket.createSignedUploadUrl(key)
    if (error || !data) throw storageError('pembuatan URL unggah', error?.message)
    return { url: data.signedUrl, headers: { 'content-type': mime, 'x-upsert': 'false' } }
  },
  async put(key, data, mime) {
    const bucket = await supabaseBucket()
    const { error } = await bucket.upload(key, data, { contentType: mime, upsert: false })
    if (error) throw storageError('penyimpanan berkas', error.message)
  },
  async inspect(key) {
    const bucket = await supabaseBucket()
    const { data, error } = await bucket.download(key)
    if (error || !data) return null
    const buf = Buffer.from(await data.arrayBuffer())
    return { sha256: createHash('sha256').update(buf).digest('hex'), size: buf.length }
  },
  async remove(key) {
    const bucket = await supabaseBucket()
    await bucket.remove([key])
  },
  async locate(key) {
    const bucket = await supabaseBucket()
    const { data, error } = await bucket.createSignedUrl(key, 300)
    if (error || !data) throw storageError('pembukaan berkas', error?.message)
    return { type: 'url', url: data.signedUrl }
  },
}

export const supabaseConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Pilih driver storage.
 * - STORAGE_DRIVER=supabase → Supabase.
 * - Di Vercel, filesystem hanya-baca sehingga driver lokal tidak mungkin bekerja: pakai Supabase
 *   bila kredensialnya ada walau STORAGE_DRIVER lupa diisi, dan beri error jelas (bukan 500) bila tidak ada.
 * - Selain itu → lokal (.data/uploads).
 */
export function storageDriverName(): 'local' | 'supabase' | 'unconfigured' {
  const wanted = process.env.STORAGE_DRIVER
  if (wanted === 'supabase') return 'supabase'
  if (process.env.VERCEL) return supabaseConfigured() ? 'supabase' : 'unconfigured'
  return 'local'
}

export function storage(): StorageDriver {
  const name = storageDriverName()
  if (name === 'supabase') return supabaseDriver
  if (name === 'local') return localDriver
  console.error('[storage] Vercel tanpa SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY: unggah bukti tidak dapat disimpan.')
  throw new HttpError(503, 'Penyimpanan berkas bukti belum dikonfigurasi di server. Hubungi admin.')
}

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const ALLOWED_MIME = /^(image\/(jpeg|png|webp|heic|heif|gif)|video\/(mp4|quicktime|webm|3gpp))$/

export function safeFileName(name: string) {
  const base = name.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-80)
  return base || 'berkas'
}
