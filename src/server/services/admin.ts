import 'server-only'
import { and, asc, desc, eq, inArray, isNull, lt, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema as s } from '../db/client'
import { badRequest, conflict, notFound } from '../http'
import { computeCharge, isComplete, summaryLines, type Rule, type ValidationState } from '@/lib/validation'
import { adminStatus, STATUS_DETAIL, type CaseStatus } from '@/lib/labels'
import { fmtDateTime, maskName } from '@/lib/format'
import type { SessionUser } from './auth'
import { audit, systemMessage } from './audit'
import { getCaseBundle } from './cases'

const STAGE_HOURS = 72

async function loadCase(code: string) {
  const db = await getDb()
  const c = await db.query.cases.findFirst({ where: eq(s.cases.code, code.toUpperCase()) })
  if (!c) throw notFound('Kasus tidak ditemukan.')
  return c
}

// ── Daftar laporan (A1) ─────────────────────────────────
export async function listCases(filter: 'semua' | 'baru' | 'diproses' | 'selesai' = 'semua') {
  const db = await getDb()
  const rows = await db
    .select({ c: s.cases, reporter: s.users.name, awb: s.shipments.awb })
    .from(s.cases)
    .innerJoin(s.users, eq(s.users.id, s.cases.reporterId))
    .innerJoin(s.shipments, eq(s.shipments.id, s.cases.shipmentId))
    .orderBy(desc(s.cases.createdAt))
  const counts = { baru: 0, diproses: 0, selesai: 0 }
  const items = rows.map((r) => {
    const st = adminStatus(r.c.status)
    counts[st.label.toLowerCase() as keyof typeof counts]++
    return {
      code: r.c.code, status: r.c.status, statusLabel: st.label, tone: st.tone, category: r.c.category, categoryOther: r.c.categoryOther,
      reporter: maskName(r.reporter), createdAt: r.c.createdAt, awb: r.awb, priority: r.c.priority, escalated: !!r.c.escalatedAt,
    }
  })
  const filtered = filter === 'semua' ? items : items.filter((i) => i.statusLabel.toLowerCase() === filter)
  return { items: filtered, counts }
}

// ── Detail kasus untuk admin (A1–A3 + investigasi) ──────
export async function getAdminCase(code: string) {
  const c = await loadCase(code)
  const bundle = await getCaseBundle(c.id)
  const db = await getDb()
  const [checks, events, notes, rules, admins] = await Promise.all([
    db.select().from(s.identityChecks).where(eq(s.identityChecks.shipmentId, c.shipmentId)).orderBy(asc(s.identityChecks.seq)),
    db.select().from(s.shipmentEvents).where(eq(s.shipmentEvents.shipmentId, c.shipmentId)).orderBy(desc(s.shipmentEvents.occurredAt), desc(s.shipmentEvents.id)),
    db
      .select({ n: s.internalNotes, author: s.users.name })
      .from(s.internalNotes)
      .leftJoin(s.users, eq(s.users.id, s.internalNotes.authorId))
      .where(eq(s.internalNotes.caseId, c.id))
      .orderBy(desc(s.internalNotes.createdAt)),
    db.select().from(s.chargeRules).where(eq(s.chargeRules.active, true)).orderBy(asc(s.chargeRules.id)),
    db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(eq(s.users.role, 'ADMIN')).orderBy(asc(s.users.id)),
  ])
  return {
    ...bundle,
    checks,
    events,
    notes: notes.map((r) => ({ ...r.n, author: r.author ?? 'Sistem' })),
    rules: rules.map((r) => ({ id: r.id, label: r.label, percent: Number(r.percent), flatAmount: r.flatAmount })),
    admins,
  }
}
export type AdminCase = Awaited<ReturnType<typeof getAdminCase>>

// ── A1: Terima laporan ──────────────────────────────────
export async function acceptCase(code: string, admin: SessionUser) {
  const c = await loadCase(code)
  if (c.status !== 'BARU') throw conflict('Laporan sudah diterima sebelumnya.')
  const db = await getDb()
  const now = new Date()
  await db.transaction(async (tx) => {
    await tx
      .update(s.cases)
      .set({ status: 'DIPROSES', acceptedAt: now, assigneeId: c.assigneeId ?? admin.id, stageStartedAt: now, stageDeadline: new Date(now.getTime() + STAGE_HOURS * 3600_000) })
      .where(eq(s.cases.id, c.id))
    await audit(tx, { caseId: c.id, actor: admin, action: 'status', detail: 'Status diubah dari Baru menjadi Diproses' })
    await systemMessage(tx, c.id, 'Laporan diterima admin dan sedang diproses.')
  })
  return { ok: true }
}

// ── A2: Validasi ────────────────────────────────────────
const validationSchema = z.object({
  damaged: z.boolean().nullable(),
  insurance: z.enum(['asuransi', 'tanpa_asuransi']).nullable(),
  chargeRuleId: z.number().int().nullable(),
  chargeManual: z.number().int().min(0).max(1_000_000_000).nullable(),
  swapped: z.boolean().nullable(),
})

async function buildTrace(caseId: number, shipmentId: number, tx: Awaited<ReturnType<typeof getDb>>) {
  const existing = await tx.select().from(s.traceLocations).where(eq(s.traceLocations.caseId, caseId))
  if (existing.length) return
  const hubs = await tx
    .select({ hub: s.identityChecks.hub })
    .from(s.identityChecks)
    .where(and(eq(s.identityChecks.shipmentId, shipmentId), ne(s.identityChecks.result, 'reference')))
    .orderBy(asc(s.identityChecks.seq))
  const names = Array.from(new Set(hubs.map((h) => h.hub)))
  names.push('Gudang penjual')
  await tx.insert(s.traceLocations).values(names.map((name, i) => ({ caseId, seq: i, name })))
}

async function recomputeSummary(caseId: number) {
  const db = await getDb()
  const c = (await db.query.cases.findFirst({ where: eq(s.cases.id, caseId) }))!
  const shipment = (await db.query.shipments.findFirst({ where: eq(s.shipments.id, c.shipmentId) }))!
  const v = (await db.query.caseValidations.findFirst({ where: eq(s.caseValidations.caseId, caseId) }))!
  const rules = (await db.select().from(s.chargeRules)).map((r) => ({ id: r.id, label: r.label, percent: Number(r.percent), flatAmount: r.flatAmount }))
  const trace = await db.select().from(s.traceLocations).where(eq(s.traceLocations.caseId, caseId)).orderBy(asc(s.traceLocations.seq))
  const state = toState(v)
  const chargeTotal = v.damaged && v.insurance === 'tanpa_asuransi' ? computeCharge(state, rules, shipment.itemValue) : null
  const lines = summaryLines(state, chargeTotal, trace, v.redeliveryAt ? fmtDateTime(v.redeliveryAt) : null)
  await db.update(s.caseValidations).set({ chargeTotal, summary: lines.join('\n'), updatedAt: new Date() }).where(eq(s.caseValidations.caseId, caseId))
  return { complete: isComplete(state, chargeTotal, trace), lines, chargeTotal }
}

function toState(v: typeof s.caseValidations.$inferSelect): ValidationState {
  return {
    damaged: v.damaged,
    insurance: (v.insurance as ValidationState['insurance']) ?? null,
    chargeRuleId: v.chargeRuleId,
    chargeManual: v.chargeManual,
    swapped: v.swapped,
  }
}

function assertOpen(c: { status: CaseStatus }) {
  if (c.status === 'BARU') throw conflict('Terima laporan terlebih dahulu.')
  if (c.status === 'SELESAI') throw conflict('Laporan sudah ditutup.')
}

export async function saveValidation(code: string, admin: SessionUser, input: unknown) {
  const data = validationSchema.parse(input)
  const c = await loadCase(code)
  assertOpen(c)
  const db = await getDb()
  const prev = await db.query.caseValidations.findFirst({ where: eq(s.caseValidations.caseId, c.id) })
  await db.transaction(async (tx) => {
    await tx
      .insert(s.caseValidations)
      .values({ caseId: c.id, ...data })
      .onConflictDoUpdate({
        target: s.caseValidations.caseId,
        set: {
          damaged: data.damaged,
          insurance: data.damaged ? data.insurance : null,
          chargeRuleId: data.damaged && data.insurance === 'tanpa_asuransi' ? data.chargeRuleId : null,
          chargeManual: data.damaged && data.insurance === 'tanpa_asuransi' ? data.chargeManual : null,
          swapped: data.swapped,
          updatedAt: new Date(),
        },
      })
    if (data.swapped) await buildTrace(c.id, c.shipmentId, tx as unknown as Awaited<ReturnType<typeof getDb>>)
    const changes: string[] = []
    if (prev?.damaged !== data.damaged && data.damaged != null) changes.push(`barang rusak: ${data.damaged ? 'Ya' : 'Tidak'}`)
    if (prev?.swapped !== data.swapped && data.swapped != null) changes.push(`barang tertukar: ${data.swapped ? 'Ya' : 'Tidak'}`)
    if (prev?.insurance !== data.insurance && data.insurance) changes.push(data.insurance === 'asuransi' ? 'diganti asuransi' : 'tidak diganti asuransi')
    if (changes.length) await audit(tx, { caseId: c.id, actor: admin, action: 'validasi', detail: `Validasi: ${changes.join(', ')}` })
  })
  return recomputeSummary(c.id)
}

const traceSchema = z.object({ status: z.enum(['belum', 'tidak_ada', 'ditemukan']) })

export async function setTraceStatus(code: string, locId: number, admin: SessionUser, input: unknown) {
  const { status } = traceSchema.parse(input)
  const c = await loadCase(code)
  assertOpen(c)
  const db = await getDb()
  const loc = await db.query.traceLocations.findFirst({ where: and(eq(s.traceLocations.id, locId), eq(s.traceLocations.caseId, c.id)) })
  if (!loc) throw notFound('Lokasi tidak ditemukan.')
  await db.transaction(async (tx) => {
    if (status === 'ditemukan') {
      // Hanya satu lokasi yang dapat berstatus "ditemukan".
      await tx.update(s.traceLocations).set({ status: 'tidak_ada', updatedAt: new Date() }).where(and(eq(s.traceLocations.caseId, c.id), eq(s.traceLocations.status, 'ditemukan')))
    }
    await tx.update(s.traceLocations).set({ status, updatedAt: new Date() }).where(eq(s.traceLocations.id, locId))
    await tx
      .update(s.caseValidations)
      .set({ foundLocationId: status === 'ditemukan' ? locId : sql`case when ${s.caseValidations.foundLocationId} = ${locId} then null else ${s.caseValidations.foundLocationId} end` })
      .where(eq(s.caseValidations.caseId, c.id))
    const label = { belum: 'diatur ulang', tidak_ada: 'tidak ditemukan', ditemukan: 'paket ditemukan' }[status]
    await audit(tx, { caseId: c.id, actor: admin, action: 'pelacakan', detail: `${loc.name}: ${label}` })
  })
  return recomputeSummary(c.id)
}

const redeliverySchema = z.object({ date: z.string().min(8) })

export async function scheduleRedelivery(code: string, admin: SessionUser, input: unknown) {
  const { date } = redeliverySchema.parse(input)
  const when = new Date(date)
  if (Number.isNaN(when.getTime())) throw badRequest('Tanggal tidak valid.')
  if (when.getTime() < Date.now() - 3600_000) throw badRequest('Tanggal pengiriman ulang harus di masa depan.')
  const c = await loadCase(code)
  assertOpen(c)
  const db = await getDb()
  const v = await db.query.caseValidations.findFirst({ where: eq(s.caseValidations.caseId, c.id) })
  if (!v?.swapped || !v.foundLocationId) throw conflict('Tandai lokasi paket ditemukan terlebih dahulu.')
  await db.transaction(async (tx) => {
    await tx.update(s.caseValidations).set({ redeliveryAt: when }).where(eq(s.caseValidations.caseId, c.id))
    await audit(tx, { caseId: c.id, actor: admin, action: 'pengiriman_ulang', detail: `Pengiriman ulang dijadwalkan ${fmtDateTime(when)}` })
    await systemMessage(tx, c.id, `Paket Anda ditemukan dan pengiriman ulang dijadwalkan ${fmtDateTime(when)}.`)
  })
  return recomputeSummary(c.id)
}

export async function sendDecision(code: string, admin: SessionUser) {
  const c = await loadCase(code)
  assertOpen(c)
  const r = await recomputeSummary(c.id)
  if (!r.complete) throw conflict('Lengkapi validasi sebelum mengirim keputusan.')
  const db = await getDb()
  await db.transaction(async (tx) => {
    await tx.insert(s.messages).values({ caseId: c.id, senderRole: 'admin', senderId: admin.id, kind: 'keputusan', body: `Ringkasan keputusan:\n${r.lines.join('\n')}` })
    await tx.update(s.caseValidations).set({ decisionSentAt: new Date() }).where(eq(s.caseValidations.caseId, c.id))
    await audit(tx, { caseId: c.id, actor: admin, action: 'keputusan', detail: 'Ringkasan keputusan dikirim ke pelapor' })
  })
  return { ok: true }
}

const closeSchema = z.object({ cause: z.string().trim().max(500).optional() })

export async function closeCase(code: string, admin: SessionUser, input: unknown) {
  const { cause } = closeSchema.parse(input ?? {})
  const c = await loadCase(code)
  assertOpen(c)
  const r = await recomputeSummary(c.id)
  if (!r.complete) throw conflict('Laporan tidak dapat ditutup sebelum validasi lengkap.')
  const finalCause = cause || c.cause || r.lines.join(' ')
  const db = await getDb()
  const v = await db.query.caseValidations.findFirst({ where: eq(s.caseValidations.caseId, c.id) })
  await db.transaction(async (tx) => {
    if (!v?.decisionSentAt) {
      await tx.insert(s.messages).values({ caseId: c.id, senderRole: 'admin', senderId: admin.id, kind: 'keputusan', body: `Ringkasan keputusan:\n${r.lines.join('\n')}` })
      await tx.update(s.caseValidations).set({ decisionSentAt: new Date() }).where(eq(s.caseValidations.caseId, c.id))
    }
    await tx.update(s.cases).set({ status: 'SELESAI', closedAt: new Date(), cause: finalCause, refundStatus: c.refundStatus }).where(eq(s.cases.id, c.id))
    await tx.update(s.anomalies).set({ resolvedAt: new Date() }).where(and(eq(s.anomalies.shipmentId, c.shipmentId), isNull(s.anomalies.resolvedAt)))
    await audit(tx, { caseId: c.id, actor: admin, action: 'ditutup', detail: `Laporan ditutup. Penyebab: ${finalCause}` })
    await systemMessage(tx, c.id, 'Kasus selesai dan ditutup oleh admin.')
  })
  return { ok: true }
}

// ── Investigasi: status, penugasan, penyebab ───────────
const patchSchema = z.object({
  status: z.enum(['DIPROSES', 'PENYEBAB_DITEMUKAN']).optional(),
  assigneeId: z.number().int().nullable().optional(),
  cause: z.string().trim().max(500).optional(),
})

export async function updateCase(code: string, admin: SessionUser, input: unknown) {
  const data = patchSchema.parse(input)
  const c = await loadCase(code)
  assertOpen(c)
  const db = await getDb()
  await db.transaction(async (tx) => {
    const set: Partial<typeof s.cases.$inferInsert> = {}
    if (data.status && data.status !== c.status) {
      const now = new Date()
      Object.assign(set, { status: data.status, stageStartedAt: now, stageDeadline: new Date(now.getTime() + STAGE_HOURS * 3600_000) })
      await audit(tx, { caseId: c.id, actor: admin, action: 'status', detail: `Status diubah menjadi “${STATUS_DETAIL[data.status]}”` })
      await systemMessage(tx, c.id, data.status === 'PENYEBAB_DITEMUKAN' ? 'Penyebab masalah sudah ditemukan. Penyelesaian sedang disiapkan.' : 'Kasus kembali diselidiki.')
    }
    if (data.assigneeId !== undefined && data.assigneeId !== c.assigneeId) {
      set.assigneeId = data.assigneeId
      const who = data.assigneeId ? (await tx.query.users.findFirst({ where: eq(s.users.id, data.assigneeId) }))?.name : 'tidak ada'
      await audit(tx, { caseId: c.id, actor: admin, action: 'penugasan', detail: `Kasus ditugaskan ke ${who}` })
    }
    if (data.cause !== undefined && data.cause !== (c.cause ?? '')) {
      set.cause = data.cause || null
      await audit(tx, { caseId: c.id, actor: admin, action: 'penyebab', detail: 'Penyebab kasus diperbarui' })
    }
    if (Object.keys(set).length) await tx.update(s.cases).set(set).where(eq(s.cases.id, c.id))
  })
  return { ok: true }
}

const noteSchema = z.object({ body: z.string().trim().min(1, 'Catatan tidak boleh kosong.').max(4000) })

export async function addNote(code: string, admin: SessionUser, input: unknown) {
  const { body } = noteSchema.parse(input)
  const c = await loadCase(code)
  const db = await getDb()
  await db.transaction(async (tx) => {
    await tx.insert(s.internalNotes).values({ caseId: c.id, authorId: admin.id, body })
    await audit(tx, { caseId: c.id, actor: admin, action: 'catatan', detail: 'Catatan internal ditambahkan' })
  })
  return { ok: true }
}

// ── Dasbor & antrean anomali (eks O1/O2) ────────────────
/** Jenis masalah yang dirinci di dasbor. "Barang hilang" = kategori Paket tidak diterima. */
export const DASH_CATEGORIES = ['TERTUKAR', 'RUSAK', 'TIDAK_DITERIMA'] as const
export async function getDashboard(filter: 'semua' | 'mismatch' | 'stuck' | 'no_proof' = 'semua') {
  const db = await getDb()
  const now = new Date()
  const [[active], [atRisk], openAnoms, nearDeadline, queueRows, caseGroups] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(s.shipments).where(ne(s.shipments.status, 'Diterima')),
    db.select({ n: sql<number>`count(*)::int` }).from(s.shipments).where(and(ne(s.shipments.status, 'Diterima'), lt(s.shipments.eta, now))),
    db.select({ type: s.anomalies.type, n: sql<number>`count(*)::int` }).from(s.anomalies).where(isNull(s.anomalies.resolvedAt)).groupBy(s.anomalies.type),
    db.select({ n: sql<number>`count(*)::int` }).from(s.cases).where(and(ne(s.cases.status, 'SELESAI'), lt(s.cases.stageDeadline, new Date(now.getTime() + 6 * 3600_000)))),
    db
      .select({ a: s.anomalies, awb: s.shipments.awb, assignee: s.users.name })
      .from(s.anomalies)
      .innerJoin(s.shipments, eq(s.shipments.id, s.anomalies.shipmentId))
      .leftJoin(s.users, eq(s.users.id, s.anomalies.assigneeId))
      .where(isNull(s.anomalies.resolvedAt))
      .orderBy(sql`case ${s.anomalies.severity} when 'tinggi' then 0 when 'sedang' then 1 else 2 end`, asc(s.anomalies.deadline)),
    db.select({ category: s.cases.category, status: s.cases.status, n: sql<number>`count(*)::int` }).from(s.cases).groupBy(s.cases.category, s.cases.status),
  ])
  // Rincian laporan per jenis masalah, dikelompokkan seperti status admin (Baru/Diproses/Selesai).
  const byCategory = Object.fromEntries(
    DASH_CATEGORIES.map((k) => [k, { total: 0, baru: 0, diproses: 0, selesai: 0 }]),
  ) as Record<(typeof DASH_CATEGORIES)[number], { total: number; baru: number; diproses: number; selesai: number }>
  let otherCases = 0
  for (const g of caseGroups) {
    const n = Number(g.n)
    const bucket = byCategory[g.category as keyof typeof byCategory]
    if (!bucket) {
      otherCases += n
      continue
    }
    bucket.total += n
    bucket[adminStatus(g.status).label.toLowerCase() as 'baru' | 'diproses' | 'selesai'] += n
  }
  const byType = Object.fromEntries(openAnoms.map((r) => [r.type, Number(r.n)])) as Record<string, number>
  const shipmentIds = queueRows.map((r) => r.a.shipmentId)
  const caseRows = shipmentIds.length
    ? await db.select({ code: s.cases.code, shipmentId: s.cases.shipmentId, status: s.cases.status }).from(s.cases).where(inArray(s.cases.shipmentId, shipmentIds)).orderBy(desc(s.cases.createdAt))
    : []
  const queue = queueRows
    .filter((r) => filter === 'semua' || r.a.type === filter)
    .map((r) => ({
      id: r.a.id, awb: r.awb, type: r.a.type, label: r.a.label, severity: r.a.severity, hub: r.a.hub, detectedAt: r.a.detectedAt,
      assignee: r.assignee, deadline: r.a.deadline, caseCode: caseRows.find((c) => c.shipmentId === r.a.shipmentId)?.code ?? null,
    }))
  const total = queueRows.length
  return {
    kpi: {
      active: Number(active.n),
      atRisk: Number(atRisk.n),
      stuck: byType.stuck ?? 0,
      mismatch: byType.mismatch ?? 0,
      nearDeadline: Number(nearDeadline[0].n),
    },
    counts: { semua: total, mismatch: byType.mismatch ?? 0, stuck: byType.stuck ?? 0, no_proof: byType.no_proof ?? 0 },
    queue,
    categories: byCategory,
    otherCases,
  }
}

const assignSchema = z.object({ assigneeId: z.number().int().nullable() })
export async function assignAnomaly(id: number, admin: SessionUser, input: unknown) {
  const { assigneeId } = assignSchema.parse(input)
  const db = await getDb()
  await db.update(s.anomalies).set({ assigneeId }).where(eq(s.anomalies.id, id))
  await audit(db, { actor: admin, action: 'penugasan_anomali', detail: `Anomali #${id} ditugaskan` })
  return { ok: true }
}

// ── Pindai checkpoint: perbandingan identitas otomatis ─
const scanSchema = z.object({
  awb: z.string().trim().min(4).transform((v) => v.toUpperCase()),
  hub: z.string().trim().min(3, 'Nama hub wajib diisi.').max(120),
  weightKg: z.number().positive('Berat harus lebih dari 0.').max(1000),
  lengthCm: z.number().positive().max(500),
  widthCm: z.number().positive().max(500),
  heightCm: z.number().positive().max(500),
  sealNo: z.string().trim().min(3, 'Nomor segel wajib diisi.').max(40).transform((v) => v.toUpperCase()),
})

export async function recordScan(admin: SessionUser, input: unknown) {
  const data = scanSchema.parse(input)
  const db = await getDb()
  const shipment = await db.query.shipments.findFirst({ where: eq(s.shipments.awb, data.awb) })
  if (!shipment) throw notFound('Nomor resi tidak ditemukan.')
  const checks = await db.select().from(s.identityChecks).where(eq(s.identityChecks.shipmentId, shipment.id)).orderBy(asc(s.identityChecks.seq))
  const ref = checks.find((c) => c.result === 'reference')
  if (!ref) throw conflict('Paket ini belum memiliki catatan pengambilan sebagai acuan.')

  const diffs: string[] = []
  if (Math.abs((ref.weightKg ?? 0) - data.weightKg) > (ref.weightKg ?? 0) * 0.02 + 0.005) diffs.push('berat')
  const refDims = [ref.lengthCm, ref.widthCm, ref.heightCm].map(Number).sort((a, b) => a - b)
  const newDims = [data.lengthCm, data.widthCm, data.heightCm].sort((a, b) => a - b)
  if (refDims.some((v, i) => Math.abs(v - newDims[i]) > 0.5)) diffs.push('ukuran')
  if ((ref.sealNo ?? '').toUpperCase() !== data.sealNo) diffs.push('nomor segel')
  const mismatch = diffs.length > 0
  const isFirst = mismatch && !checks.some((c) => c.isFirstMismatch)
  const now = new Date()
  const openCase = await db.query.cases.findFirst({ where: and(eq(s.cases.shipmentId, shipment.id), ne(s.cases.status, 'SELESAI')) })

  await db.transaction(async (tx) => {
    await tx.insert(s.identityChecks).values({
      shipmentId: shipment.id, seq: (checks.at(-1)?.seq ?? 0) + 1, hub: data.hub, checkedAt: now,
      weightKg: data.weightKg, lengthCm: data.lengthCm, widthCm: data.widthCm, heightCm: data.heightCm, sealNo: data.sealNo,
      result: mismatch ? 'mismatch' : 'match', isFirstMismatch: isFirst, officer: admin.name,
      note: mismatch ? `Berbeda pada ${diffs.join(', ')} dibanding catatan pengambilan.` : null,
    })
    await tx.insert(s.shipmentEvents).values({
      shipmentId: shipment.id, occurredAt: now, kind: 'hub_scan', title: data.hub, location: data.hub, actor: `Petugas ${admin.name}`,
      method: 'Pindai petugas', identityResult: mismatch ? 'mismatch' : 'match', isFirstMismatch: isFirst,
      note: mismatch ? `Identitas paket tidak cocok: ${diffs.join(', ')} berbeda dari catatan pengambilan.` : null,
    })
    if (shipment.status !== 'Diterima') {
      await tx.update(s.shipments).set({ status: 'Dalam perjalanan', statusSource: 'Pindai', statusAt: now }).where(eq(s.shipments.id, shipment.id))
    }
    if (isFirst) {
      await tx.insert(s.anomalies).values({
        shipmentId: shipment.id, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: data.hub.replace(/^Hub (Transit )?/i, ''),
        detectedAt: now, deadline: new Date(now.getTime() + STAGE_HOURS * 3600_000),
      })
    }
    await audit(tx, {
      caseId: openCase?.id ?? null, actor: admin, action: 'pindai',
      detail: `Pindai ${data.awb} di ${data.hub}: ${mismatch ? `tidak cocok (${diffs.join(', ')})` : 'cocok'}${isFirst ? ', ketidakcocokan pertama' : ''}`,
    })
  })
  return { result: mismatch ? 'mismatch' : 'match', diffs, isFirstMismatch: isFirst, reference: ref }
}

// ── Log audit global ────────────────────────────────────
export async function listAudit(limit = 100) {
  const db = await getDb()
  return db
    .select({ a: s.auditLogs, code: s.cases.code })
    .from(s.auditLogs)
    .leftJoin(s.cases, eq(s.cases.id, s.auditLogs.caseId))
    .orderBy(desc(s.auditLogs.createdAt), desc(s.auditLogs.id))
    .limit(limit)
}

// ── Insiden publik (C10) ───────────────────────────────
const incidentSchema = z.object({
  caseCode: z.string().optional().nullable(),
  type: z.enum(['Paket tertukar', 'Status tidak valid', 'Keterlambatan hub', 'Lainnya']),
  title: z.string().trim().min(5, 'Judul minimal 5 karakter.').max(200),
  cause: z.string().trim().min(5, 'Penyebab wajib diisi.').max(500),
  fix: z.string().trim().min(5, 'Perbaikan wajib diisi.').max(500),
  resolutionDays: z.number().int().min(0).max(365),
})

export async function publishIncident(admin: SessionUser, input: unknown) {
  const data = incidentSchema.parse(input)
  const db = await getDb()
  let caseId: number | null = null
  if (data.caseCode) {
    const c = await loadCase(data.caseCode)
    if (c.status !== 'SELESAI') throw conflict('Hanya kasus yang sudah selesai yang dapat dipublikasikan.')
    const dup = await db.query.incidents.findFirst({ where: eq(s.incidents.caseId, c.id) })
    if (dup) throw conflict(`Kasus ini sudah dipublikasikan sebagai ${dup.code}.`)
    caseId = c.id
  }
  const now = new Date()
  const year = now.getFullYear()
  const rows = await db
    .select({ n: sql<number>`coalesce(max(cast(split_part(${s.incidents.code}, '-', 3) as integer)), 0)` })
    .from(s.incidents)
    .where(sql`${s.incidents.code} like ${`INC-${year}-%`}`)
  const code = `INC-${year}-${String(Number(rows[0]?.n ?? 0) + 1).padStart(3, '0')}`
  const period = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(now).replace('.', '')
  const [row] = await db.insert(s.incidents).values({ code, ...data, caseId, period }).returning()
  await audit(db, { caseId, actor: admin, action: 'insiden', detail: `Insiden ${code} dipublikasikan` })
  return row
}

export async function closedCasesWithoutIncident() {
  const db = await getDb()
  return db
    .select({ code: s.cases.code, category: s.cases.category, cause: s.cases.cause, createdAt: s.cases.createdAt, closedAt: s.cases.closedAt })
    .from(s.cases)
    .leftJoin(s.incidents, eq(s.incidents.caseId, s.cases.id))
    .where(and(eq(s.cases.status, 'SELESAI'), isNull(s.incidents.id)))
    .orderBy(desc(s.cases.closedAt))
}

export type { Rule }
