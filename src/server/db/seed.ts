import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import type { DB } from './client'
import * as s from './schema'

const d = (iso: string) => new Date(iso)
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000)
const todayAt = (hh: number, mm: number) => {
  const t = new Date()
  t.setHours(hh, mm, 0, 0)
  return t
}

/** Mengisi data contoh bila tabel users masih kosong. Aman dipanggil berulang. */
export async function seedIfEmpty(db: DB) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(s.users)
  if (Number(count) > 0) return false
  await seed(db)
  return true
}

export async function seed(db: DB) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eshipmennt.test').toLowerCase()
  const adminPass = process.env.ADMIN_PASSWORD || 'admin12345'
  const hash = (p: string) => bcrypt.hashSync(p, 10)
  const randomPass = hash(crypto.randomUUID())

  await db.transaction(async (tx) => {
    // ── Users ───────────────────────────────────────────
    const [admin, invA, invB, dina, rina, maya, teguh] = await tx
      .insert(s.users)
      .values([
        { name: 'Admin Ekspedisi', email: adminEmail, passwordHash: hash(adminPass), role: 'ADMIN' },
        { name: 'Investigator A', email: 'investigator.a@eshipmennt.test', passwordHash: randomPass, role: 'ADMIN' },
        { name: 'Investigator B', email: 'investigator.b@eshipmennt.test', passwordHash: randomPass, role: 'ADMIN' },
        { name: 'Dina Anggraini', email: 'pengguna@eshipmennt.test', phone: '081234567890', passwordHash: hash('pengguna12345'), role: 'PENGGUNA' },
        { name: 'Rina Saputri', email: 'rina@eshipmennt.test', phone: '081311112222', passwordHash: randomPass, role: 'PENGGUNA' },
        { name: 'Maya Pratama', email: 'maya@eshipmennt.test', phone: '081322223333', passwordHash: randomPass, role: 'PENGGUNA' },
        { name: 'Teguh Wibowo', email: 'teguh@eshipmennt.test', phone: '081333334444', passwordHash: randomPass, role: 'PENGGUNA' },
      ])
      .returning()

    // ── Shipments ───────────────────────────────────────
    const [sh999, sh417, sh208, sh733, sh100] = await tx
      .insert(s.shipments)
      .values([
        {
          awb: 'JT110461625999', origin: 'Jakarta Barat', destination: 'Bandung',
          recipientName: dina.name, recipientPhone: dina.phone!, recipientAddress: 'Jl. Contoh No. 12, Bandung',
          ownerId: dina.id, status: 'Diterima', statusSource: 'OTP', statusAt: d('2026-07-24T14:02:00+07:00'),
          eta: d('2026-07-24T17:00:00+07:00'), etaConfidence: 'tinggi', itemValue: 397388,
        },
        {
          awb: 'JT110461625417', origin: 'Jakarta Timur', destination: 'Surabaya',
          recipientName: rina.name, recipientPhone: rina.phone!, recipientAddress: 'Jl. Contoh No. 4, Surabaya',
          ownerId: rina.id, status: 'Diterima', statusSource: 'OTP', statusAt: d('2026-07-24T10:15:00+07:00'),
          eta: d('2026-07-24T17:00:00+07:00'), itemValue: 1250000,
        },
        {
          awb: 'JT110461625208', origin: 'Jakarta Selatan', destination: 'Bandung',
          recipientName: maya.name, recipientPhone: maya.phone!, recipientAddress: 'Jl. Contoh No. 8, Bandung',
          ownerId: maya.id, status: 'Dalam perjalanan', statusSource: 'Pindai', statusAt: d('2026-07-23T07:00:00+07:00'),
          eta: d('2026-07-24T17:00:00+07:00'), etaConfidence: 'rendah', itemValue: 540000,
        },
        {
          awb: 'JT110461625733', origin: 'Jakarta Pusat', destination: 'Medan',
          recipientName: teguh.name, recipientPhone: teguh.phone!, recipientAddress: 'Jl. Contoh No. 21, Medan',
          ownerId: teguh.id, status: 'Diterima', statusSource: 'Manual petugas', statusAt: d('2026-07-23T20:15:00+07:00'),
          eta: d('2026-07-23T17:00:00+07:00'), itemValue: 215000,
        },
        {
          awb: 'JT110461625100', origin: 'Jakarta Barat', destination: 'Yogyakarta',
          recipientName: 'Penerima Demo', recipientPhone: '089900001234', recipientAddress: 'Jl. Contoh No. 1, Yogyakarta',
          status: 'Dalam perjalanan', statusSource: 'Pindai', statusAt: hoursFromNow(-5),
          eta: hoursFromNow(28), etaConfidence: 'tinggi', itemValue: 180000,
        },
      ])
      .returning()

    // ── Linimasa JT110461625999 (C2) ────────────────────
    await tx.insert(s.shipmentEvents).values([
      { shipmentId: sh999.id, occurredAt: d('2026-07-21T16:20:00+07:00'), kind: 'pickup', title: 'Paket diambil', location: 'Jakarta Barat', method: 'Pindai QR label · Foto dan segel tercatat' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-21T22:05:00+07:00'), kind: 'hub_scan', title: 'Hub Asal Jakarta Barat', location: 'Hub Jakarta Barat', actor: 'Petugas ••• 117', method: 'Pindai petugas', identityResult: 'match' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-22T06:30:00+07:00'), kind: 'hub_scan', title: 'Hub Transit Cikarang', location: 'Hub Transit Cikarang', actor: 'Petugas ••• 214', method: 'Pindai petugas', identityResult: 'mismatch', isFirstMismatch: true, note: 'Berat, ukuran, dan nomor segel berbeda dari catatan pengambilan.' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-22T06:30:00+07:00'), kind: 'no_scan', title: 'Tidak ada pemindaian selama 18 jam', location: 'Hub Padalarang', gapUntil: d('2026-07-23T00:30:00+07:00'), note: 'Hub Padalarang tidak memindai paket' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-23T21:40:00+07:00'), kind: 'hub_scan', title: 'Tiba di Hub Bandung', location: 'Hub Bandung', actor: 'Petugas ••• 305', method: 'Pindai petugas', identityResult: 'mismatch', note: 'Identitas paket: tidak cocok dengan catatan pengambilan' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-24T09:15:00+07:00'), kind: 'out_for_delivery', title: 'Dalam pengantaran', location: 'Bandung', actor: 'Kurir ••• 482', method: 'Pindai QR label' },
      { shipmentId: sh999.id, occurredAt: d('2026-07-24T14:02:00+07:00'), kind: 'delivered', title: 'Diterima', location: 'Bandung (perkiraan)', actor: 'Penerima', method: 'Verifikasi OTP' },
      // Paket lain (ringkas)
      { shipmentId: sh417.id, occurredAt: d('2026-07-22T15:00:00+07:00'), kind: 'pickup', title: 'Paket diambil', location: 'Jakarta Timur', method: 'Pindai QR label' },
      { shipmentId: sh417.id, occurredAt: d('2026-07-24T11:42:00+07:00'), kind: 'hub_scan', title: 'Hub Surabaya Selatan', location: 'Hub Surabaya Selatan', actor: 'Petugas ••• 552', method: 'Pindai petugas', identityResult: 'mismatch', isFirstMismatch: true },
      { shipmentId: sh417.id, occurredAt: d('2026-07-24T10:15:00+07:00'), kind: 'delivered', title: 'Diterima', location: 'Surabaya (perkiraan)', actor: 'Penerima', method: 'Verifikasi OTP' },
      { shipmentId: sh208.id, occurredAt: d('2026-07-22T13:00:00+07:00'), kind: 'pickup', title: 'Paket diambil', location: 'Jakarta Selatan', method: 'Pindai QR label' },
      { shipmentId: sh208.id, occurredAt: d('2026-07-23T07:00:00+07:00'), kind: 'hub_scan', title: 'Hub Padalarang', location: 'Hub Padalarang', actor: 'Petugas ••• 090', method: 'Pindai petugas', identityResult: 'match' },
      { shipmentId: sh208.id, occurredAt: d('2026-07-23T07:00:00+07:00'), kind: 'no_scan', title: 'Tidak ada pemindaian selama 26 jam', location: 'Hub Padalarang', gapUntil: d('2026-07-24T09:00:00+07:00') },
      { shipmentId: sh733.id, occurredAt: d('2026-07-22T10:00:00+07:00'), kind: 'pickup', title: 'Paket diambil', location: 'Jakarta Pusat', method: 'Pindai QR label' },
      { shipmentId: sh733.id, occurredAt: d('2026-07-23T20:15:00+07:00'), kind: 'delivered', title: 'Diterima', location: 'Medan Kota', actor: 'Petugas', method: 'Pembaruan manual, tanpa bukti' },
      { shipmentId: sh100.id, occurredAt: hoursFromNow(-30), kind: 'pickup', title: 'Paket diambil', location: 'Jakarta Barat', method: 'Pindai QR label · Foto dan segel tercatat' },
      { shipmentId: sh100.id, occurredAt: hoursFromNow(-22), kind: 'hub_scan', title: 'Hub Asal Jakarta Barat', location: 'Hub Jakarta Barat', actor: 'Petugas ••• 117', method: 'Pindai petugas', identityResult: 'match' },
      { shipmentId: sh100.id, occurredAt: hoursFromNow(-5), kind: 'hub_scan', title: 'Hub Transit Semarang', location: 'Hub Transit Semarang', actor: 'Petugas ••• 640', method: 'Pindai petugas', identityResult: 'match' },
    ])

    // ── Pemeriksaan identitas (C4 / investigasi) ────────
    const ref = { weightKg: 2.4, lengthCm: 38, widthCm: 28, heightCm: 20, sealNo: 'SEG-88214' }
    const swapped = { weightKg: 0.85, lengthCm: 24, widthCm: 20, heightCm: 12, sealNo: 'SEG-70933' }
    await tx.insert(s.identityChecks).values([
      { shipmentId: sh999.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: d('2026-07-21T16:20:00+07:00'), ...ref, result: 'reference' },
      { shipmentId: sh999.id, seq: 1, hub: 'Hub Jakarta Barat', checkedAt: d('2026-07-21T22:05:00+07:00'), ...ref, weightKg: 2.41, result: 'match', officer: '••• 117' },
      { shipmentId: sh999.id, seq: 2, hub: 'Hub Transit Cikarang', checkedAt: d('2026-07-22T06:30:00+07:00'), ...swapped, result: 'mismatch', isFirstMismatch: true, officer: '••• 214', note: 'Paket yang dipindai di hub ini lebih ringan, lebih kecil, dan bersegel lain dari paket saat diambil. Penyebabnya belum dipastikan.' },
      { shipmentId: sh999.id, seq: 3, hub: 'Hub Padalarang', result: 'not_scanned', note: 'Tidak ada pemindaian selama 18 jam (22 Jul 06:30 sampai 23 Jul 00:30).' },
      { shipmentId: sh999.id, seq: 4, hub: 'Hub Bandung', checkedAt: d('2026-07-23T21:40:00+07:00'), ...swapped, result: 'mismatch', officer: '••• 305' },
      { shipmentId: sh417.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: d('2026-07-22T15:00:00+07:00'), weightKg: 3.1, lengthCm: 40, widthCm: 30, heightCm: 25, sealNo: 'SEG-61002', result: 'reference' },
      { shipmentId: sh417.id, seq: 1, hub: 'Hub Surabaya Selatan', checkedAt: d('2026-07-24T11:42:00+07:00'), weightKg: 2.6, lengthCm: 40, widthCm: 30, heightCm: 25, sealNo: 'SEG-61002', result: 'mismatch', isFirstMismatch: true, officer: '••• 552' },
      { shipmentId: sh208.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: d('2026-07-22T13:00:00+07:00'), weightKg: 1.2, lengthCm: 30, widthCm: 20, heightCm: 10, sealNo: 'SEG-50411', result: 'reference' },
      { shipmentId: sh208.id, seq: 1, hub: 'Hub Padalarang', checkedAt: d('2026-07-23T07:00:00+07:00'), weightKg: 1.2, lengthCm: 30, widthCm: 20, heightCm: 10, sealNo: 'SEG-50411', result: 'match', officer: '••• 090' },
      { shipmentId: sh733.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: d('2026-07-22T10:00:00+07:00'), weightKg: 0.9, lengthCm: 25, widthCm: 18, heightCm: 8, sealNo: 'SEG-40021', result: 'reference' },
      { shipmentId: sh100.id, seq: 0, hub: 'Catatan pengambilan', checkedAt: hoursFromNow(-30), weightKg: 1.5, lengthCm: 30, widthCm: 25, heightCm: 15, sealNo: 'SEG-90100', result: 'reference' },
      { shipmentId: sh100.id, seq: 1, hub: 'Hub Jakarta Barat', checkedAt: hoursFromNow(-22), weightKg: 1.5, lengthCm: 30, widthCm: 25, heightCm: 15, sealNo: 'SEG-90100', result: 'match', officer: '••• 117' },
      { shipmentId: sh100.id, seq: 2, hub: 'Hub Transit Semarang', checkedAt: hoursFromNow(-5), weightKg: 1.51, lengthCm: 30, widthCm: 25, heightCm: 15, sealNo: 'SEG-90100', result: 'match', officer: '••• 640' },
    ])

    // ── Bukti ───────────────────────────────────────────
    const locked = d('2026-07-24T14:48:00+07:00')
    const ev = await tx
      .insert(s.evidence)
      .values([
        { shipmentId: sh999.id, ownerType: 'courier', kind: 'pickup', mediaType: 'none', source: 'courier', fileName: 'Foto paket saat diambil', sha256: '6f1c0d2a9e4b7c3f5a8d1e2b4c6f8a0d3e5b7c9f1a2d4e6b8c0f2a4d6e8b0c2a', meta: JSON.stringify({ berat: '2,40 kg', ukuran: '38 × 28 × 20 cm', segel: 'SEG-88214', lokasi: 'Jakarta Barat (perkiraan)' }), createdAt: d('2026-07-21T16:20:11+07:00'), lockedAt: d('2026-07-21T16:20:11+07:00') },
        { shipmentId: sh999.id, ownerType: 'courier', kind: 'handover', mediaType: 'none', source: 'courier', fileName: 'Foto serah terima', sha256: '9a3e5c7b1d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c', meta: JSON.stringify({ metode: 'Konfirmasi OTP', penerima: 'D••• A•••', lokasi: 'Bandung (perkiraan)' }), createdAt: d('2026-07-24T14:02:40+07:00'), lockedAt: d('2026-07-24T14:02:40+07:00') },
        { shipmentId: sh999.id, ownerType: 'courier', kind: 'hub_scan', mediaType: 'none', source: 'courier', fileName: 'Foto pindai Hub Cikarang', sha256: '2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d', meta: JSON.stringify({ hub: 'Hub Transit Cikarang' }), createdAt: d('2026-07-22T06:30:52+07:00'), lockedAt: d('2026-07-22T06:30:52+07:00') },
        { shipmentId: sh999.id, ownerType: 'user', uploadedBy: dina.id, kind: 'unboxing', mediaType: 'image', source: 'device', fileName: 'Foto-unboxing-1.jpg', mime: 'image/jpeg', size: 1843200, sha256: '4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e', createdAt: d('2026-07-24T14:20:00+07:00'), lockedAt: locked },
        { shipmentId: sh999.id, ownerType: 'user', uploadedBy: dina.id, kind: 'unboxing', mediaType: 'image', source: 'device', fileName: 'Foto-unboxing-2.jpg', mime: 'image/jpeg', size: 1720320, sha256: '8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b', createdAt: d('2026-07-24T14:20:00+07:00'), lockedAt: locked },
        { shipmentId: sh417.id, ownerType: 'user', uploadedBy: rina.id, kind: 'unboxing', mediaType: 'image', source: 'device', fileName: 'Kemasan-penyok.jpg', mime: 'image/jpeg', size: 1500000, sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', createdAt: todayAt(9, 5), lockedAt: todayAt(9, 12) },
      ])
      .returning()

    // ── Ketentuan charge (contoh) ───────────────────────
    await tx.insert(s.chargeRules).values([
      { label: '50% nilai barang: kemasan tidak memadai', percent: '50' },
      { label: '100% nilai barang: kelalaian penanganan', percent: '100' },
      { label: '25% nilai barang: kerusakan ringan', percent: '25' },
      { label: 'Biaya tetap Rp50.000: kerusakan kemasan luar', percent: '0', flatAmount: 50000 },
    ])

    // ── Kasus ───────────────────────────────────────────
    const story412 = 'Barang yang saya terima tidak sesuai dengan pesanan. Nilai pesanan Rp397.388.'
    const story411 = 'Kemasan basah dan penyok saat tiba. Isi paket rusak, foto kemasan sudah saya unggah.'
    const story409 = 'Status menunjukkan paket masih di Padalarang sejak kemarin, belum ada kabar.'
    const story405 = 'Kemasan basah saat diterima, isi masih aman.'
    const [k412, k411, k409, k405] = await tx
      .insert(s.cases)
      .values([
        { code: 'KS-0412', shipmentId: sh999.id, reporterId: dina.id, category: 'TERTUKAR', storyHtml: `<p>${story412}</p>`, storyText: story412, contactChannel: 'whatsapp', status: 'BARU', priority: 'tinggi', stageStartedAt: todayAt(9, 41), stageDeadline: hoursFromNow(30), createdAt: todayAt(9, 41) },
        { code: 'KS-0411', shipmentId: sh417.id, reporterId: rina.id, category: 'RUSAK', storyHtml: `<p>${story411}</p>`, storyText: story411, contactChannel: 'email', status: 'BARU', priority: 'sedang', stageStartedAt: todayAt(9, 12), stageDeadline: hoursFromNow(49), createdAt: todayAt(9, 12) },
        { code: 'KS-0409', shipmentId: sh208.id, reporterId: maya.id, category: 'TIDAK_DITERIMA', storyHtml: `<p>${story409}</p>`, storyText: story409, contactChannel: 'whatsapp', status: 'DIPROSES', priority: 'sedang', assigneeId: invA.id, acceptedAt: hoursFromNow(-15), stageStartedAt: hoursFromNow(-15), stageDeadline: hoursFromNow(51), createdAt: hoursFromNow(-17) },
        { code: 'KS-0405', shipmentId: sh733.id, reporterId: teguh.id, category: 'LAINNYA', categoryOther: 'kemasan basah', storyHtml: `<p>${story405}</p>`, storyText: story405, contactChannel: 'email', status: 'SELESAI', priority: 'rendah', assigneeId: invB.id, cause: 'Kemasan terkena hujan saat bongkar muat di Medan Kota.', acceptedAt: d('2026-11-06T13:00:00+07:00'), closedAt: d('2026-11-08T10:00:00+07:00'), stageStartedAt: d('2026-11-08T10:00:00+07:00'), stageDeadline: d('2026-11-11T10:00:00+07:00'), refundStatus: 'Tidak diperlukan', createdAt: d('2026-11-06T11:05:00+07:00') },
      ])
      .returning()

    const evMap = Object.fromEntries(ev.map((e) => [e.fileName, e.id]))
    await tx.insert(s.caseEvidence).values([
      { caseId: k412.id, evidenceId: evMap['Foto-unboxing-1.jpg'] },
      { caseId: k412.id, evidenceId: evMap['Foto-unboxing-2.jpg'] },
      { caseId: k412.id, evidenceId: evMap['Foto serah terima'] },
      { caseId: k411.id, evidenceId: evMap['Kemasan-penyok.jpg'] },
    ])

    await tx.insert(s.messages).values([
      { caseId: k412.id, senderRole: 'pelapor', senderId: dina.id, body: story412, createdAt: todayAt(9, 41) },
      { caseId: k411.id, senderRole: 'pelapor', senderId: rina.id, body: story411, createdAt: todayAt(9, 12) },
      { caseId: k409.id, senderRole: 'pelapor', senderId: maya.id, body: story409, createdAt: hoursFromNow(-17) },
      { caseId: k409.id, senderRole: 'sistem', body: 'Laporan diterima admin dan sedang diproses.', kind: 'status', createdAt: hoursFromNow(-15) },
      { caseId: k409.id, senderRole: 'admin', senderId: invA.id, body: 'Terima kasih, laporan Anda sudah kami terima dan sedang diperiksa.', createdAt: hoursFromNow(-15) },
      { caseId: k405.id, senderRole: 'pelapor', senderId: teguh.id, body: story405, createdAt: d('2026-11-06T11:05:00+07:00') },
      { caseId: k405.id, senderRole: 'admin', senderId: invB.id, kind: 'keputusan', body: 'Ringkasan keputusan: Barang tidak rusak. Barang tidak tertukar. Kasus ditutup.', createdAt: d('2026-11-08T10:00:00+07:00') },
    ])

    await tx.insert(s.caseValidations).values([
      { caseId: k412.id }, { caseId: k411.id }, { caseId: k409.id },
      { caseId: k405.id, damaged: false, swapped: false, summary: 'Barang tidak rusak.\nBarang tidak tertukar.', decisionSentAt: d('2026-11-08T10:00:00+07:00') },
    ])

    await tx.insert(s.auditLogs).values([
      { caseId: k412.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 3 bukti terlampir', createdAt: todayAt(9, 41) },
      { caseId: k412.id, actorLabel: 'Sistem', action: 'perbandingan_otomatis', detail: 'Perbandingan identitas otomatis: ketidakcocokan pertama di Hub Transit Cikarang', createdAt: todayAt(9, 42) },
      { caseId: k411.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor dengan 1 bukti terlampir', createdAt: todayAt(9, 12) },
      { caseId: k409.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor', createdAt: hoursFromNow(-17) },
      { caseId: k409.id, actorId: invA.id, actorLabel: 'Investigator A', action: 'status', detail: 'Status diubah dari Baru menjadi Diproses', createdAt: hoursFromNow(-15) },
      { caseId: k405.id, actorLabel: 'Sistem', action: 'kasus_dibuat', detail: 'Laporan dibuat oleh pelapor', createdAt: d('2026-11-06T11:05:00+07:00') },
      { caseId: k405.id, actorId: invB.id, actorLabel: 'Investigator B', action: 'ditutup', detail: 'Laporan ditutup. Penyebab: kemasan terkena hujan saat bongkar muat', createdAt: d('2026-11-08T10:00:00+07:00') },
    ])

    // ── Antrean anomali (eks O2) ────────────────────────
    await tx.insert(s.anomalies).values([
      { shipmentId: sh999.id, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: 'Cikarang', detectedAt: d('2026-07-24T15:10:00+07:00'), deadline: hoursFromNow(30) },
      { shipmentId: sh417.id, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: 'Surabaya Selatan', detectedAt: d('2026-07-24T11:42:00+07:00'), assigneeId: invB.id, deadline: hoursFromNow(49) },
      { shipmentId: sh208.id, type: 'stuck', label: 'Macet, tanpa pindai 26 jam', severity: 'sedang', hub: 'Padalarang', detectedAt: d('2026-07-24T09:00:00+07:00'), assigneeId: invA.id, deadline: hoursFromNow(51) },
      { shipmentId: sh733.id, type: 'no_proof', label: 'Diterima tanpa bukti', severity: 'sedang', hub: 'Medan Kota', detectedAt: d('2026-07-23T20:15:00+07:00'), deadline: hoursFromNow(57) },
    ])

    // ── Pengungkapan insiden (C10) ──────────────────────
    await tx.insert(s.incidents).values([
      { code: 'INC-2026-031', type: 'Paket tertukar', title: 'Paket tertukar di jalur pengiriman', cause: 'Kesalahan penanganan di hub transit', resolutionDays: 4, fix: 'Pemindaian identitas wajib di setiap hub', period: 'Jul 2026', publishedAt: d('2026-07-29T10:00:00+07:00') },
      { code: 'INC-2026-029', type: 'Status tidak valid', title: 'Status “diterima” tanpa bukti serah terima', cause: 'Pembaruan status manual oleh petugas', resolutionDays: 2, fix: 'Status diterima hanya lewat OTP atau QR', period: 'Jul 2026', publishedAt: d('2026-07-20T10:00:00+07:00') },
      { code: 'INC-2026-027', type: 'Keterlambatan hub', title: 'Paket macet di hub', cause: 'Antrean bongkar muat melebihi kapasitas', resolutionDays: 1, fix: 'Peringatan dini saat tidak ada pindai 12 jam', period: 'Jul 2026', publishedAt: d('2026-07-15T10:00:00+07:00') },
      { code: 'INC-2026-024', type: 'Lainnya', title: 'Segel paket rusak', cause: 'Pengemasan ulang tanpa catatan', resolutionDays: 6, fix: 'Foto dan nomor segel baru wajib dicatat', period: 'Jul 2026', publishedAt: d('2026-07-10T10:00:00+07:00') },
    ])

    void admin
    void k411
  })
}
