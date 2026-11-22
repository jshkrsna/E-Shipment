import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema as s } from '../db/client'
import { badRequest, conflict, forbidden, notFound } from '../http'
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, safeFileName, storage } from '../storage'
import type { SessionUser } from './auth'
import { getOwnedShipment } from './shipments'

const fileMeta = z.object({
  awb: z.string().min(4),
  fileName: z.string().min(1).max(200),
  mime: z.string().regex(ALLOWED_MIME, 'Hanya foto (JPG, PNG, WEBP, HEIC) atau video (MP4, MOV, WEBM) yang diterima.'),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES, 'Ukuran berkas maksimal 50 MB.'),
})

export async function requestUpload(user: SessionUser, input: unknown) {
  const meta = fileMeta.parse(input)
  const shipment = await getOwnedShipment(meta.awb, user)
  const key = `${shipment.id}/${randomUUID()}-${safeFileName(meta.fileName)}`
  const target = await storage().createUpload(key, meta.mime)
  return { key, uploadUrl: target.url, headers: target.headers }
}

const registerSchema = fileMeta.extend({
  key: z.string().min(5),
  durationSec: z.number().int().nonnegative().max(36000).optional(),
})

export async function registerUpload(user: SessionUser, input: unknown) {
  const data = registerSchema.parse(input)
  const shipment = await getOwnedShipment(data.awb, user)
  if (!data.key.startsWith(`${shipment.id}/`)) throw forbidden('Kunci berkas tidak cocok dengan paket.')
  const info = await storage().inspect(data.key)
  if (!info) throw badRequest('Berkas belum terunggah. Coba lagi.')
  if (info.size > MAX_UPLOAD_BYTES) {
    await storage().remove(data.key)
    throw badRequest('Ukuran berkas maksimal 50 MB.')
  }
  const db = await getDb()
  const [row] = await db
    .insert(s.evidence)
    .values({
      shipmentId: shipment.id,
      ownerType: 'user',
      uploadedBy: user.id,
      kind: 'unboxing',
      mediaType: data.mime.startsWith('video/') ? 'video' : 'image',
      source: 'device',
      fileName: data.fileName.slice(0, 200),
      storageKey: data.key,
      mime: data.mime,
      size: info.size,
      durationSec: data.durationSec ?? null,
      sha256: info.sha256,
    })
    .returning()
  return row
}

const driveSchema = z.object({ awb: z.string().min(4), fileId: z.string().min(5).max(200), accessToken: z.string().min(10) })

/** Impor berkas dari Google Drive memakai access token dari Google Picker (OAuth di browser pengguna). */
export async function importFromDrive(user: SessionUser, input: unknown) {
  const { awb, fileId, accessToken } = driveSchema.parse(input)
  const shipment = await getOwnedShipment(awb, user)
  const auth = { Authorization: `Bearer ${accessToken}` }
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,size,videoMediaMetadata`, { headers: auth })
  if (!metaRes.ok) throw badRequest('Tidak dapat membaca berkas Google Drive. Pastikan izin akses diberikan.')
  const meta = (await metaRes.json()) as { name: string; mimeType: string; size?: string; videoMediaMetadata?: { durationMillis?: string } }
  const parsed = fileMeta.parse({ awb, fileName: meta.name, mime: meta.mimeType, size: Number(meta.size || 0) || 1 })
  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers: auth })
  if (!fileRes.ok) throw badRequest('Gagal mengunduh berkas dari Google Drive.')
  const buf = Buffer.from(await fileRes.arrayBuffer())
  if (buf.length > MAX_UPLOAD_BYTES) throw badRequest('Ukuran berkas maksimal 50 MB.')
  const key = `${shipment.id}/${randomUUID()}-${safeFileName(parsed.fileName)}`
  await storage().put(key, buf, parsed.mime)
  const info = await storage().inspect(key)
  const db = await getDb()
  const [row] = await db
    .insert(s.evidence)
    .values({
      shipmentId: shipment.id, ownerType: 'user', uploadedBy: user.id, kind: 'unboxing',
      mediaType: parsed.mime.startsWith('video/') ? 'video' : 'image', source: 'google_drive',
      fileName: parsed.fileName, storageKey: key, mime: parsed.mime, size: buf.length,
      durationSec: meta.videoMediaMetadata?.durationMillis ? Math.round(Number(meta.videoMediaMetadata.durationMillis) / 1000) : null,
      sha256: info?.sha256 ?? null,
    })
    .returning()
  return row
}

export async function deleteEvidence(user: SessionUser, id: number) {
  const db = await getDb()
  const row = await db.query.evidence.findFirst({ where: and(eq(s.evidence.id, id), isNull(s.evidence.deletedAt)) })
  if (!row) throw notFound('Berkas tidak ditemukan.')
  if (row.ownerType !== 'user' || row.uploadedBy !== user.id) throw forbidden('Anda hanya dapat menghapus berkas milik Anda.')
  if (row.lockedAt) throw conflict('Berkas sudah dilampirkan pada laporan dan tidak dapat dihapus.')
  await db.update(s.evidence).set({ deletedAt: new Date() }).where(eq(s.evidence.id, id))
  if (row.storageKey) await storage().remove(row.storageKey).catch(() => undefined)
  return { ok: true }
}

/** Izin melihat berkas: pemilik paket, admin, atau pemegang tautan bukti yang masih berlaku. */
export async function authorizeEvidenceFile(id: number, viewer: SessionUser | null, shareToken?: string | null) {
  const db = await getDb()
  const row = await db.query.evidence.findFirst({ where: and(eq(s.evidence.id, id), isNull(s.evidence.deletedAt)) })
  if (!row || !row.storageKey) throw notFound('Berkas tidak ditemukan.')
  if (viewer?.role === 'ADMIN') return row
  const shipment = await db.query.shipments.findFirst({ where: eq(s.shipments.id, row.shipmentId) })
  if (viewer && shipment?.ownerId === viewer.id) return row
  if (shareToken) {
    const link = await db
      .select({ id: s.shareLinks.id })
      .from(s.shareLinks)
      .innerJoin(s.caseEvidence, eq(s.caseEvidence.caseId, s.shareLinks.caseId))
      .where(and(eq(s.shareLinks.token, shareToken), isNull(s.shareLinks.revokedAt), gt(s.shareLinks.expiresAt, new Date()), eq(s.caseEvidence.evidenceId, id)))
      .limit(1)
    if (link.length) return row
    // Bukti kurir (pengambilan/serah terima) dari paket yang sama dengan kasus yang dibagikan.
    if (row.ownerType === 'courier') {
      const courierLink = await db
        .select({ id: s.shareLinks.id })
        .from(s.shareLinks)
        .innerJoin(s.cases, eq(s.cases.id, s.shareLinks.caseId))
        .where(and(eq(s.shareLinks.token, shareToken), isNull(s.shareLinks.revokedAt), gt(s.shareLinks.expiresAt, new Date()), eq(s.cases.shipmentId, row.shipmentId)))
        .limit(1)
      if (courierLink.length) return row
    }
  }
  throw forbidden('Anda tidak memiliki akses ke berkas ini.')
}
