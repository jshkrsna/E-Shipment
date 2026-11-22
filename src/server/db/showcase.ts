import bcrypt from 'bcryptjs'
import { and, eq, inArray, isNotNull, like, or, sql } from 'drizzle-orm'
import type { DB } from './client'
import * as s from './schema'
import { BULK_PREFIX, bulkShipmentRow, bulkTimeline, buildBulkPackages, type BulkPackage } from './showcase-packages'

/**
 * Akun & data peraga untuk presentasi/dokumentasi.
 * Setiap akun pengguna mewakili satu keadaan laporan; semua kasus ditangani SATU admin (ADMIN_EMAIL).
 * Aman dijalankan berulang: data peraga lama dihapus lalu dibuat ulang ke keadaan awal.
 */
export const SHOWCASE_PASSWORD = 'showcase2026'

export const SHOWCASE_ACCOUNTS = [
  { key: 'tidakbisa', email: 'demo.tidakbisa@eshipmennt.test', name: 'Andi Demo', phone: '081100001101', scenario: 'Tidak bisa melapor: paket belum diklaim / milik akun lain' },
  { key: 'baru', email: 'demo.baru@eshipmennt.test', name: 'Bunga Demo', phone: '081100002202', scenario: 'Laporan terkirim, menunggu ditinjau admin (Baru)' },
  { key: 'diproses', email: 'demo.diproses@eshipmennt.test', name: 'Citra Demo', phone: '081100003303', scenario: 'Laporan sedang diselidiki admin (Diproses)' },
  { key: 'penyebab', email: 'demo.penyebab@eshipmennt.test', name: 'Dimas Demo', phone: '081100004404', scenario: 'Penyebab ditemukan, menunggu keputusan dikirim' },
  { key: 'selesai', email: 'demo.selesai@eshipmennt.test', name: 'Eka Demo', phone: '081100005505', scenario: 'Kasus selesai dan ditutup' },
  { key: 'pelapor', email: 'demo.pelapor@eshipmennt.test', name: 'Fitri Demo', phone: '081100006606', scenario: 'Pemilik paket peraga massal, siap dilaporkan (lihat docs/SHOWCASE.md)' },
] as const

/** Resi peraga. */
export const SHOWCASE_AWB = {
  belumKlaim: 'JT990000000101', // tanpa pemilik; diklaim akun "tidakbisa" dengan 4 digit 1101
  milikLain: 'JT990000000102', // milik akun "baru", tidak bisa diklaim akun lain
  baru: 'JT990000000202',
  diproses: 'JT990000000303',
  penyebab: 'JT990000000404',
  selesai: 'JT990000000505',
} as const

const HOUR = 3600_000
const ago = (h: number) => new Date(Date.now() - h * HOUR)
const ahead = (h: number) => new Date(Date.now() + h * HOUR)

/** Hapus semua data peraga. Mengembalikan storage key berkas yang perlu dihapus dari storage. */
export async function clearShowcase(db: DB): Promise<string[]> {
  const emails = SHOWCASE_ACCOUNTS.map((a) => a.email)
  const awbs = Object.values(SHOWCASE_AWB)
  const users = await db.select({ id: s.users.id }).from(s.users).where(inArray(s.users.email, emails))
  const ships = await db.select({ id: s.shipments.id }).from(s.shipments).where(or(inArray(s.shipments.awb, awbs), like(s.shipments.awb, `${BULK_PREFIX}%`)))
  const userIds = users.map((u) => u.id)
  const shipIds = ships.map((x) => x.id)
  if (!userIds.length && !shipIds.length) return []
  const none = [-1]
  const uIds = userIds.length ? userIds : none
  const sIds = shipIds.length ? shipIds : none

  const keys: string[] = []
  await db.transaction(async (tx) => {
    const caseRows = await tx.select({ id: s.cases.id }).from(s.cases).where(or(inArray(s.cases.reporterId, uIds), inArray(s.cases.shipmentId, sIds)))
    const caseIds = caseRows.map((c) => c.id)
    if (caseIds.length) {
      // Insiden yang dipublikasikan dari kasus peraga ikut dihapus (FK tanpa cascade).
      await tx.delete(s.incidents).where(inArray(s.incidents.caseId, caseIds))
      await tx.delete(s.cases).where(inArray(s.cases.id, caseIds)) // cascade: pesan, validasi, audit, tautan, dst.
    }
    const ev = await tx
      .select({ id: s.evidence.id, key: s.evidence.storageKey })
      .from(s.evidence)
      .where(and(or(inArray(s.evidence.shipmentId, sIds), inArray(s.evidence.uploadedBy, uIds)), isNotNull(s.evidence.storageKey)))
    keys.push(...ev.map((e) => e.key!))
    await tx.delete(s.caseEvidence).where(inArray(s.caseEvidence.evidenceId, ev.length ? ev.map((e) => e.id) : none))
    await tx.delete(s.evidence).where(or(inArray(s.evidence.shipmentId, sIds), inArray(s.evidence.uploadedBy, uIds)))
    // Paket non-peraga yang sempat diklaim akun peraga dikembalikan tanpa pemilik.
    await tx.update(s.shipments).set({ ownerId: null }).where(and(inArray(s.shipments.ownerId, uIds), sql`${s.shipments.id} not in (${sql.join(sIds.map((i) => sql`${i}`), sql`, `)})`))
    await tx.delete(s.shipments).where(inArray(s.shipments.id, sIds)) // cascade: linimasa, pemeriksaan, anomali
    await tx.delete(s.users).where(inArray(s.users.id, uIds)) // cascade: sesi
  })
  return keys
}

async function nextCode(db: DB) {
  const [{ n }] = await db.select({ n: sql<number>`coalesce(max(cast(substring(${s.cases.code} from 4) as integer)), 400)` }).from(s.cases)
  return Number(n) + 1
}

export async function createShowcase(db: DB) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eshipmennt.test').toLowerCase()
  const admin =
    (await db.query.users.findFirst({ where: eq(s.users.email, adminEmail) })) ??
    (await db.query.users.findFirst({ where: eq(s.users.role, 'ADMIN') }))
  if (!admin) throw new Error('Akun admin belum ada. Jalankan seed terlebih dahulu.')
  const adminLabel = admin.name

  const hash = bcrypt.hashSync(SHOWCASE_PASSWORD, 10)
  const rule50 = (await db.select().from(s.chargeRules).where(eq(s.chargeRules.active, true))).find((r) => Number(r.percent) === 50)

  let n = await nextCode(db)
  const codes: Record<string, string> = {}
  const code = (k: string) => (codes[k] = `KS-${String(n++).padStart(4, '0')}`)
  let bulk: BulkPackage[] = []

  await db.transaction(async (tx) => {
    const u = Object.fromEntries(
      (
        await tx
          .insert(s.users)
          .values(SHOWCASE_ACCOUNTS.map((a) => ({ name: a.name, email: a.email, phone: a.phone, passwordHash: hash, role: 'PENGGUNA' as const })))
          .returning()
      ).map((row, i) => [SHOWCASE_ACCOUNTS[i].key, row]),
    ) as Record<(typeof SHOWCASE_ACCOUNTS)[number]['key'], typeof s.users.$inferSelect>

    // ── Paket ─────────────────────────────────────────
    const base = { courier: 'JNE', service: 'Reguler', origin: 'Jakarta Barat' }
    const [shBelum, shLain, shBaru, shDiproses, shPenyebab, shSelesai] = await tx
      .insert(s.shipments)
      .values([
        { ...base, awb: SHOWCASE_AWB.belumKlaim, destination: 'Depok', recipientName: u.tidakbisa.name, recipientPhone: u.tidakbisa.phone!, recipientAddress: 'Jl. Melati No. 3, Depok', status: 'Diterima', statusSource: 'OTP', statusAt: ago(20), eta: ago(22), itemValue: 275000 },
        { ...base, awb: SHOWCASE_AWB.milikLain, destination: 'Bekasi', recipientName: u.baru.name, recipientPhone: u.baru.phone!, recipientAddress: 'Jl. Kenanga No. 9, Bekasi', ownerId: u.baru.id, status: 'Diterima', statusSource: 'OTP', statusAt: ago(30), eta: ago(32), itemValue: 150000 },
        { ...base, awb: SHOWCASE_AWB.baru, destination: 'Bekasi', recipientName: u.baru.name, recipientPhone: u.baru.phone!, recipientAddress: 'Jl. Kenanga No. 9, Bekasi', ownerId: u.baru.id, status: 'Diterima', statusSource: 'OTP', statusAt: ago(6), eta: ago(8), itemValue: 820000 },
        { ...base, awb: SHOWCASE_AWB.diproses, destination: 'Bandung', recipientName: u.diproses.name, recipientPhone: u.diproses.phone!, recipientAddress: 'Jl. Dago No. 15, Bandung', ownerId: u.diproses.id, status: 'Diterima', statusSource: 'OTP', statusAt: ago(30), eta: ago(32), itemValue: 459000 },
        { ...base, awb: SHOWCASE_AWB.penyebab, destination: 'Semarang', recipientName: u.penyebab.name, recipientPhone: u.penyebab.phone!, recipientAddress: 'Jl. Pandanaran No. 7, Semarang', ownerId: u.penyebab.id, status: 'Diterima', statusSource: 'OTP', statusAt: ago(54), eta: ago(56), itemValue: 1200000 },
        { ...base, awb: SHOWCASE_AWB.selesai, destination: 'Yogyakarta', recipientName: u.selesai.name, recipientPhone: u.selesai.phone!, recipientAddress: 'Jl. Kaliurang No. 21, Yogyakarta', ownerId: u.selesai.id, status: 'Diterima', statusSource: 'OTP', statusAt: ago(150), eta: ago(152), itemValue: 349000 },
      ])
      .returning()

    // ── Linimasa & pemeriksaan identitas ──────────────
    const ref = { weightKg: 1.6, lengthCm: 32, widthCm: 24, heightCm: 14, sealNo: 'SEG-99001' }
    const sw = { weightKg: 0.7, lengthCm: 22, widthCm: 18, heightCm: 10, sealNo: 'SEG-71245' }
    type Ship = typeof shBelum
    const route = (sh: Ship, startH: number, transit: string, mismatch = false) => ({
      events: [
        { shipmentId: sh.id, occurredAt: ago(startH), kind: 'pickup', title: 'Paket diambil', location: sh.origin, method: 'Pindai QR label · Foto dan segel tercatat' },
        { shipmentId: sh.id, occurredAt: ago(startH - 6), kind: 'hub_scan', title: 'Hub Asal Jakarta Barat', location: 'Hub Jakarta Barat', actor: 'Petugas ••• 117', method: 'Pindai petugas', identityResult: 'match' as const },
        { shipmentId: sh.id, occurredAt: ago(startH - 14), kind: 'hub_scan', title: transit, location: transit, actor: 'Petugas ••• 233', method: 'Pindai petugas', identityResult: mismatch ? ('mismatch' as const) : ('match' as const), isFirstMismatch: mismatch, note: mismatch ? 'Berat, ukuran, dan nomor segel berbeda dari catatan pengambilan.' : null },
        { shipmentId: sh.id, occurredAt: ago(startH - 20), kind: 'out_for_delivery', title: 'Dalam pengantaran', location: sh.destination, actor: 'Kurir ••• 481', method: 'Pindai QR label' },
        { shipmentId: sh.id, occurredAt: sh.statusAt!, kind: 'delivered', title: 'Diterima', location: sh.destination, actor: 'Penerima', method: 'Verifikasi OTP' },
      ],
      checks: [
        { shipmentId: sh.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: ago(startH), ...ref, result: 'reference' as const },
        { shipmentId: sh.id, seq: 1, hub: 'Hub Jakarta Barat', checkedAt: ago(startH - 6), ...ref, result: 'match' as const, officer: '••• 117' },
        { shipmentId: sh.id, seq: 2, hub: transit, checkedAt: ago(startH - 14), ...(mismatch ? sw : ref), result: mismatch ? ('mismatch' as const) : ('match' as const), isFirstMismatch: mismatch, officer: '••• 233' },
      ],
    })
    const plan: [Ship, number, string, boolean][] = [
      [shBelum, 44, 'Hub Transit Cikarang', false],
      [shLain, 54, 'Hub Transit Cikarang', false],
      [shBaru, 30, 'Hub Transit Cikarang', false],
      [shDiproses, 54, 'Hub Transit Cikampek', true],
      [shPenyebab, 78, 'Hub Transit Cirebon', false],
      [shSelesai, 174, 'Hub Transit Solo', true],
    ]
    const routes = plan.map(([sh, h, hub, mm]) => route(sh, h, hub, mm))
    await tx.insert(s.shipmentEvents).values(routes.flatMap((r) => r.events))
    await tx.insert(s.identityChecks).values(routes.flatMap((r) => r.checks))

    // Catatan kurir (tanpa berkas foto: tampil "Foto belum dilampirkan kurir").
    await tx.insert(s.evidence).values(
      plan.flatMap(([sh, startH]) => [
        { shipmentId: sh.id, ownerType: 'courier' as const, kind: 'pickup' as const, mediaType: 'none', source: 'courier' as const, fileName: 'Catatan pengambilan', meta: JSON.stringify({ berat: '1,60 kg', ukuran: '32 × 24 × 14 cm', segel: ref.sealNo, lokasi: `${sh.origin} (perkiraan)` }), createdAt: ago(startH), lockedAt: ago(startH) },
        { shipmentId: sh.id, ownerType: 'courier' as const, kind: 'handover' as const, mediaType: 'none', source: 'courier' as const, fileName: 'Catatan serah terima', meta: JSON.stringify({ metode: 'Konfirmasi OTP', lokasi: `${sh.destination} (perkiraan)` }), createdAt: sh.statusAt!, lockedAt: sh.statusAt! },
      ]),
    )

    // ── Kasus ─────────────────────────────────────────
    const story = {
      baru: 'Kardus penyok di sisi kanan dan layar monitor di dalamnya retak saat paket saya buka.',
      diproses: 'Isi paket bukan sepatu yang saya pesan, melainkan buku. Berat paket juga terasa jauh lebih ringan.',
      penyebab: 'Kemasan sobek dan basah, dua dari enam botol kaca di dalamnya pecah.',
      selesai: 'Barang yang datang tertukar dengan paket orang lain. Pesanan saya tas ransel hitam.',
    }
    const [kBaru, kDiproses, kPenyebab, kSelesai] = await tx
      .insert(s.cases)
      .values([
        { code: code('baru'), shipmentId: shBaru.id, reporterId: u.baru.id, category: 'RUSAK', storyHtml: `<p>${story.baru}</p>`, storyText: story.baru, contactChannel: 'whatsapp', status: 'BARU', priority: 'sedang', stageStartedAt: ago(2), stageDeadline: ahead(70), createdAt: ago(2) },
        { code: code('diproses'), shipmentId: shDiproses.id, reporterId: u.diproses.id, category: 'TERTUKAR', storyHtml: `<p>${story.diproses}</p>`, storyText: story.diproses, contactChannel: 'email', status: 'DIPROSES', priority: 'tinggi', assigneeId: admin.id, acceptedAt: ago(20), stageStartedAt: ago(20), stageDeadline: ahead(52), createdAt: ago(26) },
        { code: code('penyebab'), shipmentId: shPenyebab.id, reporterId: u.penyebab.id, category: 'RUSAK', storyHtml: `<p>${story.penyebab}</p>`, storyText: story.penyebab, contactChannel: 'whatsapp', status: 'PENYEBAB_DITEMUKAN', priority: 'sedang', assigneeId: admin.id, cause: 'Kemasan tertekan tumpukan paket berat saat bongkar muat di Hub Transit Cirebon.', acceptedAt: ago(46), stageStartedAt: ago(4), stageDeadline: ahead(68), createdAt: ago(50) },
        { code: code('selesai'), shipmentId: shSelesai.id, reporterId: u.selesai.id, category: 'TERTUKAR', storyHtml: `<p>${story.selesai}</p>`, storyText: story.selesai, contactChannel: 'email', status: 'SELESAI', priority: 'tinggi', assigneeId: admin.id, cause: 'Label paket tertukar saat penyortiran manual di Hub Transit Solo.', acceptedAt: ago(140), closedAt: ago(48), refundStatus: 'Tidak diperlukan', stageStartedAt: ago(48), stageDeadline: ago(1), createdAt: ago(146) },
      ])
      .returning()

    // Pelacakan per lokasi (barang tertukar).
    const [, , tFound] = await tx
      .insert(s.traceLocations)
      .values([
        { caseId: kDiproses.id, seq: 1, name: 'Hub Transit Cikampek', status: 'tidak_ada', updatedAt: ago(10) },
        { caseId: kDiproses.id, seq: 2, name: 'Hub Bandung', status: 'belum' },
        { caseId: kSelesai.id, seq: 1, name: 'Hub Transit Solo', status: 'ditemukan', updatedAt: ago(100) },
        { caseId: kSelesai.id, seq: 2, name: 'Hub Yogyakarta', status: 'tidak_ada', updatedAt: ago(110) },
      ])
      .returning()

    const charge = rule50 ? Math.round((Number(rule50.percent) / 100) * shPenyebab.itemValue + rule50.flatAmount) : null
    const penyebabSummary = charge != null ? `Barang rusak: tidak diganti asuransi, charge Rp${charge.toLocaleString('id-ID')}.\nBarang tidak tertukar.` : 'Barang rusak: diganti dengan asuransi.\nBarang tidak tertukar.'
    const selesaiSummary = `Barang tidak rusak.\nBarang tertukar: paket ditemukan di Hub Transit Solo.`
    await tx.insert(s.caseValidations).values([
      { caseId: kBaru.id },
      { caseId: kDiproses.id, damaged: false, swapped: true, summary: 'Barang tidak rusak.\nBarang tertukar: pelacakan berjalan (1 dari 2 lokasi diperiksa).' },
      charge != null
        ? { caseId: kPenyebab.id, damaged: true, insurance: 'tanpa_asuransi', chargeRuleId: rule50!.id, chargeTotal: charge, swapped: false, summary: penyebabSummary }
        : { caseId: kPenyebab.id, damaged: true, insurance: 'asuransi', swapped: false, summary: penyebabSummary },
      { caseId: kSelesai.id, damaged: false, swapped: true, foundLocationId: tFound.id, redeliveryAt: ago(72), summary: selesaiSummary, decisionSentAt: ago(48) },
    ])

    await tx.insert(s.messages).values([
      { caseId: kBaru.id, senderRole: 'pelapor', senderId: u.baru.id, body: story.baru, createdAt: ago(2) },

      { caseId: kDiproses.id, senderRole: 'pelapor', senderId: u.diproses.id, body: story.diproses, createdAt: ago(26) },
      { caseId: kDiproses.id, senderRole: 'sistem', kind: 'status', body: 'Laporan diterima admin dan sedang diproses.', createdAt: ago(20) },
      { caseId: kDiproses.id, senderRole: 'admin', senderId: admin.id, body: 'Terima kasih, laporan Anda sudah kami terima dan sedang diperiksa.', createdAt: ago(20) },
      { caseId: kDiproses.id, senderRole: 'admin', senderId: admin.id, body: 'Paket Anda sedang kami lacak di setiap hub yang dilalui. Kami akan mengabari begitu paket ditemukan.', createdAt: ago(10) },
      { caseId: kDiproses.id, senderRole: 'pelapor', senderId: u.diproses.id, body: 'Baik, terima kasih. Saya tunggu kabarnya.', createdAt: ago(9) },

      { caseId: kPenyebab.id, senderRole: 'pelapor', senderId: u.penyebab.id, body: story.penyebab, createdAt: ago(50) },
      { caseId: kPenyebab.id, senderRole: 'sistem', kind: 'status', body: 'Laporan diterima admin dan sedang diproses.', createdAt: ago(46) },
      { caseId: kPenyebab.id, senderRole: 'admin', senderId: admin.id, body: 'Mohon kirim foto tambahan dari sisi kemasan yang sobek agar kami bisa memastikan penyebabnya.', createdAt: ago(40) },
      { caseId: kPenyebab.id, senderRole: 'pelapor', senderId: u.penyebab.id, body: 'Sudah saya tambahkan di brankas bukti, terima kasih.', createdAt: ago(36) },
      { caseId: kPenyebab.id, senderRole: 'sistem', kind: 'status', body: 'Penyebab masalah sudah ditemukan. Penyelesaian sedang disiapkan.', createdAt: ago(4) },

      { caseId: kSelesai.id, senderRole: 'pelapor', senderId: u.selesai.id, body: story.selesai, createdAt: ago(146) },
      { caseId: kSelesai.id, senderRole: 'sistem', kind: 'status', body: 'Laporan diterima admin dan sedang diproses.', createdAt: ago(140) },
      { caseId: kSelesai.id, senderRole: 'sistem', kind: 'status', body: 'Paket Anda ditemukan dan pengiriman ulang dijadwalkan.', createdAt: ago(98) },
      { caseId: kSelesai.id, senderRole: 'admin', senderId: admin.id, kind: 'keputusan', body: `Ringkasan keputusan:\n${selesaiSummary}`, createdAt: ago(48) },
      { caseId: kSelesai.id, senderRole: 'sistem', kind: 'status', body: 'Kasus selesai dan ditutup oleh admin.', createdAt: ago(48) },
      { caseId: kSelesai.id, senderRole: 'pelapor', senderId: u.selesai.id, body: 'Paket yang benar sudah saya terima. Terima kasih!', createdAt: ago(40) },
    ])

    await tx.insert(s.auditLogs).values([
      { caseId: kBaru.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 0 bukti terlampir', createdAt: ago(2) },
      { caseId: kDiproses.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 0 bukti terlampir', createdAt: ago(26) },
      { caseId: kDiproses.id, actorLabel: 'Sistem', action: 'perbandingan_otomatis', detail: 'Perbandingan identitas otomatis: ketidakcocokan pertama di Hub Transit Cikampek', createdAt: ago(26) },
      { caseId: kDiproses.id, actorId: admin.id, actorLabel: adminLabel, action: 'status', detail: 'Status diubah dari Baru menjadi Diproses', createdAt: ago(20) },
      { caseId: kDiproses.id, actorId: admin.id, actorLabel: adminLabel, action: 'pelacakan', detail: 'Hub Transit Cikampek: paket tidak ada', createdAt: ago(10) },
      { caseId: kPenyebab.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 0 bukti terlampir', createdAt: ago(50) },
      { caseId: kPenyebab.id, actorId: admin.id, actorLabel: adminLabel, action: 'status', detail: 'Status diubah dari Baru menjadi Diproses', createdAt: ago(46) },
      { caseId: kPenyebab.id, actorId: admin.id, actorLabel: adminLabel, action: 'status', detail: 'Status diubah menjadi “Penyebab teridentifikasi”', createdAt: ago(4) },
      { caseId: kSelesai.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 0 bukti terlampir', createdAt: ago(146) },
      { caseId: kSelesai.id, actorId: admin.id, actorLabel: adminLabel, action: 'status', detail: 'Status diubah dari Baru menjadi Diproses', createdAt: ago(140) },
      { caseId: kSelesai.id, actorId: admin.id, actorLabel: adminLabel, action: 'pelacakan', detail: 'Hub Transit Solo: paket ditemukan', createdAt: ago(100) },
      { caseId: kSelesai.id, actorId: admin.id, actorLabel: adminLabel, action: 'keputusan', detail: 'Ringkasan keputusan dikirim ke pelapor', createdAt: ago(48) },
      { caseId: kSelesai.id, actorId: admin.id, actorLabel: adminLabel, action: 'ditutup', detail: 'Laporan ditutup. Penyebab: label paket tertukar saat penyortiran manual di Hub Transit Solo', createdAt: ago(48) },
    ])

    // Antrean anomali admin untuk paket tertukar yang masih diselidiki.
    await tx.insert(s.anomalies).values([
      { shipmentId: shDiproses.id, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: 'Cikampek', detectedAt: ago(40), assigneeId: admin.id, deadline: ahead(52) },
      { shipmentId: shSelesai.id, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: 'Solo', detectedAt: ago(160), assigneeId: admin.id, deadline: ago(60), resolvedAt: ago(48) },
    ])

    // ── 100 paket peraga (semua status), mayoritas milik demo.pelapor ──
    bulk = buildBulkPackages({ name: u.pelapor.name, phone: u.pelapor.phone! })
    const rows = await tx.insert(s.shipments).values(bulk.map((p) => bulkShipmentRow(p, p.owned ? u.pelapor.id : null))).returning({ id: s.shipments.id, awb: s.shipments.awb })
    const idOf = new Map(rows.map((r) => [r.awb, r.id]))
    const parts = bulk.map((p) => bulkTimeline(p, idOf.get(p.awb)!, admin.id))
    const chunks = <T,>(a: T[], n = 200) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
    for (const c of chunks(parts.flatMap((x) => x.events))) await tx.insert(s.shipmentEvents).values(c)
    for (const c of chunks(parts.flatMap((x) => x.checks))) await tx.insert(s.identityChecks).values(c)
    for (const c of chunks(parts.flatMap((x) => x.evidence))) await tx.insert(s.evidence).values(c)
    const anom = parts.flatMap((x) => x.anomalies)
    if (anom.length) await tx.insert(s.anomalies).values(anom)
  })

  return { admin: { email: admin.email }, codes, bulk }
}

export async function resetShowcase(db: DB) {
  const removedKeys = await clearShowcase(db)
  const created = await createShowcase(db)
  return { removedKeys, ...created }
}
