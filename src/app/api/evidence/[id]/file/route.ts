import fs from 'node:fs'
import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { route } from '@/server/http'
import { getCurrentUser } from '@/server/services/auth'
import { authorizeEvidenceFile } from '@/server/services/evidence'
import { storage } from '@/server/storage'

export const GET = route<{ id: string }>(async (req, { id }) => {
  const share = new URL(req.url).searchParams.get('share')
  const ev = await authorizeEvidenceFile(Number(id), await getCurrentUser(), share)
  const loc = await storage().locate(ev.storageKey!)
  if (loc.type === 'url') return NextResponse.redirect(loc.url, 302)
  const stat = await fs.promises.stat(loc.path)
  const mime = ev.mime || 'application/octet-stream'
  const base = { 'content-type': mime, 'accept-ranges': 'bytes', 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff' }
  const range = req.headers.get('range')
  const m = range?.match(/bytes=(\d*)-(\d*)/)
  if (m) {
    const start = m[1] ? Number(m[1]) : 0
    const end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1
    const stream = Readable.toWeb(fs.createReadStream(loc.path, { start, end })) as ReadableStream
    return new Response(stream, { status: 206, headers: { ...base, 'content-length': String(end - start + 1), 'content-range': `bytes ${start}-${end}/${stat.size}` } })
  }
  const stream = Readable.toWeb(fs.createReadStream(loc.path)) as ReadableStream
  return new Response(stream, { headers: { ...base, 'content-length': String(stat.size) } })
})
