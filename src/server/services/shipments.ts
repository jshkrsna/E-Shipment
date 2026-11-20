import 'server-only'
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema as s } from '../db/client'
import { badRequest, conflict, notFound } from '../http'
import { maskName } from '@/lib/format'
import type { SessionUser } from './auth'

export function parseAwbs(text: string) {
  return Array.from(new Set(text.split(/[\s,;]+/).map((v) => v.trim().toUpperCase()).filter((v) => /^[A-Z0-9]{8,40}$/.test(v)))).slice(0, 10)
}

export async function findShipment(awb: string) {
  const db = await getDb()
  return db.query.shipments.findFirst({ where: eq(s.shipments.awb, awb.toUpperCase()) })
}

export async function getShipmentSummaries(awbs: string[]) {
  if (!awbs.length) return []
  const db = await getDb()
  return db.select().from(s.shipments).where(inArray(s.shipments.awb, awbs))
}

/** Data lengkap untuk halaman Lacak (C2/C3/C4). Data pribadi disamarkan untuk non-pemilik. */
export async function getTracking(awb: string, viewer: SessionUser | null) {
  const db = await getDb()
  const shipment = await findShipment(awb)
  if (!shipment) return null
  const isOwner = !!viewer && shipment.ownerId === viewer.id
  const isAdmin = viewer?.role === 'ADMIN'
  const canSeePrivate = isOwner || isAdmin

  const [events, checks, evidence, anomalies, ownCases] = await Promise.all([
    db.select().from(s.shipmentEvents).where(eq(s.shipmentEvents.shipmentId, shipment.id)).orderBy(desc(s.shipmentEvents.occurredAt), desc(s.shipmentEvents.id)),
    db.select().from(s.identityChecks).where(eq(s.identityChecks.shipmentId, shipment.id)).orderBy(asc(s.identityChecks.seq)),
    db.select().from(s.evidence).where(and(eq(s.evidence.shipmentId, shipment.id), isNull(s.evidence.deletedAt))).orderBy(asc(s.evidence.createdAt), asc(s.evidence.id)),
    db.select().from(s.anomalies).where(and(eq(s.anomalies.shipmentId, shipment.id), isNull(s.anomalies.resolvedAt))),
    canSeePrivate
      ? db.select().from(s.cases).where(eq(s.cases.shipmentId, shipment.id)).orderBy(desc(s.cases.createdAt))
      : Promise.resolve([] as (typeof s.cases.$inferSelect)[]),
  ])

  const firstMismatch = checks.find((c) => c.isFirstMismatch) ?? null
  const reference = checks.find((c) => c.result === 'reference') ?? null
  const openCase = ownCases.find((c) => c.status !== 'SELESAI') ?? null

  return {
    shipment: {
      id: shipment.id,
      awb: shipment.awb,
      courier: shipment.courier,
      service: shipment.service,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      statusSource: shipment.statusSource,
      statusAt: shipment.statusAt,
      eta: shipment.eta,
      etaConfidence: shipment.etaConfidence,
      itemValue: canSeePrivate ? shipment.itemValue : null,
      recipient: canSeePrivate ? shipment.recipientName : maskName(shipment.recipientName),
      recipientMasked: maskName(shipment.recipientName),
      claimed: shipment.ownerId != null,
    },
    events,
    checks,
    reference,
    firstMismatch,
    underInvestigation: anomalies.length > 0 || !!openCase,
    courierEvidence: evidence.filter((e) => e.ownerType === 'courier'),
    userEvidence: canSeePrivate ? evidence.filter((e) => e.ownerType === 'user') : [],
    userEvidenceCount: evidence.filter((e) => e.ownerType === 'user').length,
    cases: ownCases.map((c) => ({ code: c.code, status: c.status, category: c.category })),
    openCase: openCase ? { code: openCase.code, status: openCase.status } : null,
    isOwner,
    isAdmin,
  }
}

export type Tracking = NonNullable<Awaited<ReturnType<typeof getTracking>>>

const claimSchema = z.object({ last4: z.string().regex(/^\d{4}$/, 'Masukkan 4 digit terakhir nomor telepon penerima.') })

export async function claimShipment(awb: string, user: SessionUser, input: unknown) {
  const { last4 } = claimSchema.parse(input)
  const db = await getDb()
  const shipment = await findShipment(awb)
  if (!shipment) throw notFound('Nomor resi tidak ditemukan.')
  if (shipment.ownerId === user.id) return { ok: true }
  if (shipment.ownerId) throw conflict('Paket ini sudah diklaim oleh akun lain.')
  if (!shipment.recipientPhone.replace(/\D/g, '').endsWith(last4)) throw badRequest('4 digit terakhir tidak cocok dengan data penerima.')
  await db.update(s.shipments).set({ ownerId: user.id }).where(eq(s.shipments.id, shipment.id))
  return { ok: true }
}

export async function getOwnedShipment(awb: string, user: SessionUser) {
  const shipment = await findShipment(awb)
  if (!shipment) throw notFound('Nomor resi tidak ditemukan.')
  if (shipment.ownerId !== user.id) throw badRequest('Klaim paket ini terlebih dahulu sebagai penerima.')
  return shipment
}

/** Versi ter-cache per request (layout + page memanggil bersamaan). */
import { cache } from 'react'
export const getTrackingCached = cache(getTracking)
