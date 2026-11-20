import {
  pgTable, pgEnum, integer, text, varchar, boolean, timestamp, numeric, index, uniqueIndex, primaryKey, real,
} from 'drizzle-orm/pg-core'

const id = () => integer().primaryKey().generatedAlwaysAsIdentity()
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const ts = (name: string) => timestamp(name, { withTimezone: true })

export const roleEnum = pgEnum('role', ['PENGGUNA', 'ADMIN'])
export const caseStatusEnum = pgEnum('case_status', ['BARU', 'DIPROSES', 'PENYEBAB_DITEMUKAN', 'SELESAI'])
export const caseCategoryEnum = pgEnum('case_category', [
  'TIDAK_DITERIMA', 'TERTUKAR', 'RUSAK', 'STATUS_TIDAK_SESUAI', 'DITUDUH', 'LAINNYA',
])
export const identityResultEnum = pgEnum('identity_result', ['reference', 'match', 'mismatch', 'not_scanned'])
export const evidenceOwnerEnum = pgEnum('evidence_owner', ['courier', 'user'])
export const evidenceKindEnum = pgEnum('evidence_kind', ['pickup', 'handover', 'unboxing', 'hub_scan'])
export const evidenceSourceEnum = pgEnum('evidence_source', ['device', 'google_drive', 'courier'])
export const traceStatusEnum = pgEnum('trace_status', ['belum', 'tidak_ada', 'ditemukan'])
export const anomalyTypeEnum = pgEnum('anomaly_type', ['mismatch', 'stuck', 'no_proof'])
export const severityEnum = pgEnum('severity', ['tinggi', 'sedang', 'rendah'])
export const senderEnum = pgEnum('sender_role', ['pelapor', 'admin', 'sistem'])

export const users = pgTable('users', {
  id: id(),
  name: varchar({ length: 120 }).notNull(),
  email: varchar({ length: 160 }).notNull(),
  phone: varchar({ length: 32 }),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum().notNull().default('PENGGUNA'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)])

export const sessions = pgTable('sessions', {
  id: varchar({ length: 64 }).primaryKey(), // sha256(token)
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
  createdAt: createdAt(),
})

export const shipments = pgTable('shipments', {
  id: id(),
  awb: varchar({ length: 40 }).notNull(),
  courier: varchar({ length: 40 }).notNull().default('JNE'),
  service: varchar({ length: 40 }).notNull().default('Reguler'),
  origin: varchar({ length: 80 }).notNull(),
  destination: varchar({ length: 80 }).notNull(),
  recipientName: varchar('recipient_name', { length: 120 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 32 }).notNull(),
  recipientAddress: text('recipient_address').notNull().default(''),
  ownerId: integer('owner_id').references(() => users.id),
  status: varchar({ length: 40 }).notNull(), // Diambil, Dalam perjalanan, Dalam pengantaran, Diterima
  statusSource: varchar('status_source', { length: 80 }), // "OTP", "QR", "Pindai"
  statusAt: ts('status_at'),
  eta: ts('eta'),
  etaConfidence: varchar('eta_confidence', { length: 20 }).default('tinggi'),
  itemValue: integer('item_value').notNull().default(0),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('shipments_awb_idx').on(t.awb)])

export const shipmentEvents = pgTable('shipment_events', {
  id: id(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  occurredAt: ts('occurred_at').notNull(),
  kind: varchar({ length: 24 }).notNull(), // pickup | hub_scan | no_scan | out_for_delivery | delivered
  title: varchar({ length: 160 }).notNull(),
  location: varchar({ length: 120 }),
  actor: varchar({ length: 120 }),
  method: varchar({ length: 80 }),
  identityResult: identityResultEnum('identity_result'),
  isFirstMismatch: boolean('is_first_mismatch').notNull().default(false),
  note: text(),
  gapUntil: ts('gap_until'),
}, (t) => [index('events_shipment_idx').on(t.shipmentId, t.occurredAt)])

export const identityChecks = pgTable('identity_checks', {
  id: id(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  seq: integer().notNull(),
  hub: varchar({ length: 120 }).notNull(),
  checkedAt: ts('checked_at'),
  weightKg: real('weight_kg'),
  lengthCm: real('length_cm'),
  widthCm: real('width_cm'),
  heightCm: real('height_cm'),
  sealNo: varchar('seal_no', { length: 40 }),
  result: identityResultEnum().notNull(),
  isFirstMismatch: boolean('is_first_mismatch').notNull().default(false),
  officer: varchar({ length: 60 }),
  note: text(),
}, (t) => [index('checks_shipment_idx').on(t.shipmentId, t.seq)])

export const evidence = pgTable('evidence', {
  id: id(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  ownerType: evidenceOwnerEnum('owner_type').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  kind: evidenceKindEnum().notNull(),
  mediaType: varchar('media_type', { length: 10 }).notNull(), // image | video | none
  source: evidenceSourceEnum().notNull(),
  fileName: varchar('file_name', { length: 200 }).notNull(),
  storageKey: text('storage_key'),
  mime: varchar({ length: 100 }),
  size: integer().default(0),
  durationSec: integer('duration_sec'),
  sha256: varchar({ length: 64 }),
  meta: text(), // JSON string: berat, segel, OTP, dll.
  lockedAt: ts('locked_at'),
  deletedAt: ts('deleted_at'),
  createdAt: createdAt(),
}, (t) => [index('evidence_shipment_idx').on(t.shipmentId)])

export const cases = pgTable('cases', {
  id: id(),
  code: varchar({ length: 16 }).notNull(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id),
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  category: caseCategoryEnum().notNull(),
  categoryOther: text('category_other'),
  storyHtml: text('story_html').notNull(),
  storyText: text('story_text').notNull(),
  contactChannel: varchar('contact_channel', { length: 16 }).notNull().default('whatsapp'),
  status: caseStatusEnum().notNull().default('BARU'),
  stageStartedAt: ts('stage_started_at').notNull().defaultNow(),
  stageDeadline: ts('stage_deadline').notNull(),
  assigneeId: integer('assignee_id').references(() => users.id),
  priority: severityEnum().notNull().default('sedang'),
  cause: text(),
  refundStatus: varchar('refund_status', { length: 24 }).notNull().default('Belum diajukan'),
  acceptedAt: ts('accepted_at'),
  closedAt: ts('closed_at'),
  escalatedAt: ts('escalated_at'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('cases_code_idx').on(t.code), index('cases_status_idx').on(t.status)])

export const caseEvidence = pgTable('case_evidence', {
  caseId: integer('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  evidenceId: integer('evidence_id').notNull().references(() => evidence.id),
}, (t) => [primaryKey({ columns: [t.caseId, t.evidenceId] })])

export const chargeRules = pgTable('charge_rules', {
  id: id(),
  label: varchar({ length: 160 }).notNull(),
  percent: numeric({ precision: 5, scale: 2 }).notNull().default('0'),
  flatAmount: integer('flat_amount').notNull().default(0),
  active: boolean().notNull().default(true),
})

export const caseValidations = pgTable('case_validations', {
  caseId: integer('case_id').primaryKey().references(() => cases.id, { onDelete: 'cascade' }),
  damaged: boolean(),
  insurance: varchar({ length: 16 }), // asuransi | tanpa_asuransi
  chargeRuleId: integer('charge_rule_id').references(() => chargeRules.id),
  chargeManual: integer('charge_manual'),
  chargeTotal: integer('charge_total'),
  swapped: boolean(),
  foundLocationId: integer('found_location_id'),
  redeliveryAt: ts('redelivery_at'),
  summary: text(),
  decisionSentAt: ts('decision_sent_at'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})

export const traceLocations = pgTable('trace_locations', {
  id: id(),
  caseId: integer('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  seq: integer().notNull(),
  name: varchar({ length: 120 }).notNull(),
  status: traceStatusEnum().notNull().default('belum'),
  updatedAt: ts('updated_at'),
})

export const messages = pgTable('messages', {
  id: id(),
  caseId: integer('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  senderRole: senderEnum('sender_role').notNull(),
  senderId: integer('sender_id').references(() => users.id),
  kind: varchar({ length: 16 }).notNull().default('chat'), // chat | keputusan | status
  body: text().notNull(),
  createdAt: createdAt(),
}, (t) => [index('messages_case_idx').on(t.caseId, t.createdAt)])

export const internalNotes = pgTable('internal_notes', {
  id: id(),
  caseId: integer('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => users.id),
  body: text().notNull(),
  createdAt: createdAt(),
})

export const shareLinks = pgTable('share_links', {
  id: id(),
  caseId: integer('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  token: varchar({ length: 64 }).notNull(),
  expiresAt: ts('expires_at').notNull(),
  revokedAt: ts('revoked_at'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('share_token_idx').on(t.token)])

export const anomalies = pgTable('anomalies', {
  id: id(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  type: anomalyTypeEnum().notNull(),
  label: varchar({ length: 120 }).notNull(),
  severity: severityEnum().notNull(),
  hub: varchar({ length: 120 }).notNull(),
  detectedAt: ts('detected_at').notNull(),
  assigneeId: integer('assignee_id').references(() => users.id),
  deadline: ts('deadline').notNull(),
  resolvedAt: ts('resolved_at'),
})

export const auditLogs = pgTable('audit_logs', {
  id: id(),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').references(() => users.id),
  actorLabel: varchar('actor_label', { length: 120 }).notNull(),
  action: varchar({ length: 60 }).notNull(),
  detail: text().notNull(),
  createdAt: createdAt(),
}, (t) => [index('audit_case_idx').on(t.caseId, t.createdAt)])

export const incidents = pgTable('incidents', {
  id: id(),
  code: varchar({ length: 24 }).notNull(),
  type: varchar({ length: 40 }).notNull(), // Paket tertukar | Status tidak valid | Keterlambatan hub | Lainnya
  title: varchar({ length: 200 }).notNull(),
  cause: text().notNull(),
  resolutionDays: integer('resolution_days').notNull(),
  fix: text().notNull(),
  period: varchar({ length: 20 }).notNull(), // "Jul 2026"
  caseId: integer('case_id').references(() => cases.id),
  publishedAt: ts('published_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('incidents_code_idx').on(t.code)])

export type User = typeof users.$inferSelect
export type Shipment = typeof shipments.$inferSelect
export type ShipmentEvent = typeof shipmentEvents.$inferSelect
export type IdentityCheck = typeof identityChecks.$inferSelect
export type Evidence = typeof evidence.$inferSelect
export type Case = typeof cases.$inferSelect
export type CaseValidation = typeof caseValidations.$inferSelect
export type TraceLocation = typeof traceLocations.$inferSelect
export type Message = typeof messages.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
export type Incident = typeof incidents.$inferSelect
export type ChargeRule = typeof chargeRules.$inferSelect
export type Anomaly = typeof anomalies.$inferSelect
