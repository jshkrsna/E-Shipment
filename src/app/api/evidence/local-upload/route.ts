import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { badRequest, forbidden, route } from '@/server/http'
import { localPath, MAX_UPLOAD_BYTES, storage, verifyKeySig } from '@/server/storage'

/** Tujuan unggah untuk STORAGE_DRIVER=local (meniru signed upload URL). */
export const PUT = route(async (req) => {
  if (storage().name !== 'local') throw forbidden('Driver storage bukan lokal.')
  const u = new URL(req.url)
  const key = u.searchParams.get('key') || ''
  const exp = Number(u.searchParams.get('exp'))
  if (!verifyKeySig(key, exp, u.searchParams.get('sig') || '')) throw forbidden('Tautan unggah tidak valid atau kedaluwarsa.')
  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_UPLOAD_BYTES) throw badRequest('Ukuran berkas maksimal 50 MB.')
  if (!req.body) throw badRequest('Berkas kosong.')
  const p = localPath(key)
  await fsp.mkdir(path.dirname(p), { recursive: true })
  let size = 0
  const limited = Readable.fromWeb(req.body as import('node:stream/web').ReadableStream).on('data', (c: Buffer) => {
    size += c.length
    if (size > MAX_UPLOAD_BYTES) limited.destroy(new Error('too large'))
  })
  try {
    await pipeline(limited, fs.createWriteStream(p))
  } catch {
    await fsp.rm(p, { force: true })
    throw badRequest('Unggahan gagal atau melebihi 50 MB.')
  }
  return { ok: true, size }
})
