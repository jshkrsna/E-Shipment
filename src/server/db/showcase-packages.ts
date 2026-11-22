import * as s from './schema'

/**
 * 100 paket peraga dengan semua status. Dibangkitkan dari seed tetap (deterministik), jadi setiap
 * reset menghasilkan daftar resi, kota, nilai, dan status yang sama. Waktu relatif terhadap saat reset.
 */
export const BULK_PREFIX = 'JT9901'
export const BULK_COUNT = 100

export type BulkKind =
  | 'diterima' // Diterima dengan OTP: paling umum untuk dilaporkan (rusak, tertukar, dll.)
  | 'tanpa_bukti' // Diterima lewat pembaruan manual tanpa bukti serah terima (anomali)
  | 'pengantaran' // Dalam pengantaran
  | 'perjalanan' // Dalam perjalanan, identitas cocok
  | 'tidak_cocok' // Dalam perjalanan, identitas tidak cocok di hub transit (anomali)
  | 'macet' // Dalam perjalanan, tanpa pindai lebih dari 12 jam (anomali)
  | 'diambil' // Baru diambil kurir

export const BULK_KIND_LABEL: Record<BulkKind, string> = {
  diterima: 'Diterima (OTP)',
  tanpa_bukti: 'Diterima tanpa bukti serah terima',
  pengantaran: 'Dalam pengantaran',
  perjalanan: 'Dalam perjalanan',
  tidak_cocok: 'Dalam perjalanan · identitas tidak cocok',
  macet: 'Dalam perjalanan · macet di hub',
  diambil: 'Diambil kurir',
}

export type BulkPackage = {
  awb: string
  kind: BulkKind
  owned: boolean // true = milik akun demo.pelapor (langsung bisa dilaporkan)
  origin: string
  destination: string
  transit: string
  recipientName: string
  recipientPhone: string
  itemValue: number
  ageH: number // jam sejak paket diambil
}

/** PRNG deterministik (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CITIES = ['Jakarta Barat', 'Jakarta Timur', 'Jakarta Selatan', 'Tangerang', 'Bekasi', 'Bogor', 'Depok', 'Bandung', 'Cirebon', 'Semarang', 'Yogyakarta', 'Solo', 'Surabaya', 'Malang', 'Denpasar', 'Medan', 'Palembang', 'Makassar', 'Balikpapan', 'Pontianak']
const TRANSIT = ['Hub Transit Cikarang', 'Hub Transit Cikampek', 'Hub Transit Cirebon', 'Hub Transit Semarang', 'Hub Transit Solo', 'Hub Transit Surabaya', 'Hub Transit Palembang', 'Hub Padalarang']
const FIRST = ['Ayu', 'Budi', 'Citra', 'Dewi', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko', 'Kartika', 'Lestari', 'Made', 'Nanda', 'Oki', 'Putri', 'Rizky', 'Sari', 'Tono', 'Wulan', 'Yoga']
const LAST = ['Saputra', 'Wijaya', 'Lestari', 'Pratama', 'Hidayat', 'Kusuma', 'Santoso', 'Rahayu', 'Nugroho', 'Permata']

/** Jumlah per status: diacak (seed tetap), dengan prioritas paket yang bisa dilaporkan. */
export function buildBulkPackages(owner: { name: string; phone: string }): BulkPackage[] {
  const r = rng(20261122)
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]
  const between = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

  const counts: Record<BulkKind, number> = {
    diterima: 0, // diisi sisa agar total tepat 100
    tanpa_bukti: between(5, 8),
    pengantaran: between(7, 11),
    perjalanan: between(7, 11),
    tidak_cocok: between(4, 7),
    macet: between(3, 6),
    diambil: between(4, 7),
  }
  counts.diterima = BULK_COUNT - Object.values(counts).reduce((a, b) => a + b, 0)

  const kinds = (Object.keys(counts) as BulkKind[]).flatMap((k) => Array<BulkKind>(counts[k]).fill(k))
  // 20 paket tanpa pemilik (untuk peraga klaim), sisanya milik demo.pelapor.
  const unownedIdx = new Set<number>()
  while (unownedIdx.size < 20) unownedIdx.add(Math.floor(r() * kinds.length))

  return kinds.map((kind, i) => {
    const owned = !unownedIdx.has(i)
    let origin = pick(CITIES)
    let destination = pick(CITIES)
    while (destination === origin) destination = pick(CITIES)
    const phone = owned ? owner.phone : `0812${String(between(0, 9999)).padStart(4, '0')}${String(between(1000, 9999))}`
    const ageH = { diambil: between(2, 8), perjalanan: between(14, 40), tidak_cocok: between(18, 40), macet: between(30, 50), pengantaran: between(30, 60), diterima: between(40, 200), tanpa_bukti: between(40, 150) }[kind]
    return {
      awb: `${BULK_PREFIX}${String(i + 1).padStart(8, '0')}`,
      kind,
      owned,
      origin,
      destination,
      transit: pick(TRANSIT),
      recipientName: owned ? owner.name : `${pick(FIRST)} ${pick(LAST)}`,
      recipientPhone: phone,
      itemValue: Math.round(between(50, 2500) / 5) * 5000,
      ageH,
    }
  })
}

const HOUR = 3600_000

/** Baris DB untuk paket (tanpa id) + fungsi pembangun linimasa setelah id diketahui. */
export function bulkShipmentRow(p: BulkPackage, ownerId: number | null): typeof s.shipments.$inferInsert {
  const now = Date.now()
  const at = (hAfterPickup: number) => new Date(now - (p.ageH - hAfterPickup) * HOUR)
  const delivered = p.kind === 'diterima' || p.kind === 'tanpa_bukti'
  const status = delivered ? 'Diterima' : p.kind === 'pengantaran' ? 'Dalam pengantaran' : p.kind === 'diambil' ? 'Diambil' : 'Dalam perjalanan'
  const statusSource = p.kind === 'diterima' ? 'OTP' : p.kind === 'tanpa_bukti' ? 'Manual petugas' : 'Pindai'
  const statusAt = delivered ? at(Math.min(p.ageH - 1, 36)) : p.kind === 'pengantaran' ? at(p.ageH - 2) : p.kind === 'diambil' ? at(0) : at(Math.min(p.ageH - 1, 14))
  return {
    awb: p.awb, courier: 'JNE', service: 'Reguler', origin: p.origin, destination: p.destination,
    recipientName: p.recipientName, recipientPhone: p.recipientPhone, recipientAddress: `Jl. Peraga No. ${Number(p.awb.slice(-3))}, ${p.destination}`,
    ownerId, status, statusSource, statusAt,
    eta: delivered ? at(36) : new Date(now + (p.kind === 'diambil' ? 48 : 20) * HOUR),
    etaConfidence: p.kind === 'macet' || p.kind === 'tidak_cocok' ? 'rendah' : 'tinggi',
    itemValue: p.itemValue,
  }
}

export function bulkTimeline(p: BulkPackage, shipmentId: number, adminId: number) {
  const now = Date.now()
  const at = (h: number) => new Date(now - (p.ageH - h) * HOUR)
  const ref = { weightKg: 1 + (Number(p.awb.slice(-2)) % 30) / 10, lengthCm: 30, widthCm: 22, heightCm: 12, sealNo: `SEG-${p.awb.slice(-5)}` }
  const off = { ...ref, weightKg: Math.round(ref.weightKg * 45) / 100, lengthCm: 20, widthCm: 16, heightCm: 9, sealNo: `SEG-${String(Number(p.awb.slice(-5)) + 41000)}` }
  const destHub = `Hub ${p.destination}`
  const mismatch = p.kind === 'tidak_cocok'

  const events: (typeof s.shipmentEvents.$inferInsert)[] = [
    { shipmentId, occurredAt: at(0), kind: 'pickup', title: 'Paket diambil', location: p.origin, method: 'Pindai QR label · Foto dan segel tercatat' },
  ]
  const checks: (typeof s.identityChecks.$inferInsert)[] = [
    { shipmentId, seq: 0, hub: 'Catatan pengambilan', checkedAt: at(0), ...ref, result: 'reference' },
  ]
  const anomalies: (typeof s.anomalies.$inferInsert)[] = []
  const evidence: (typeof s.evidence.$inferInsert)[] = [
    { shipmentId, ownerType: 'courier', kind: 'pickup', mediaType: 'none', source: 'courier', fileName: 'Catatan pengambilan', meta: JSON.stringify({ berat: `${ref.weightKg.toFixed(2).replace('.', ',')} kg`, ukuran: '30 × 22 × 12 cm', segel: ref.sealNo, lokasi: `${p.origin} (perkiraan)` }), createdAt: at(0), lockedAt: at(0) },
  ]
  if (p.kind === 'diambil') return { events, checks, anomalies, evidence }

  events.push({ shipmentId, occurredAt: at(6), kind: 'hub_scan', title: `Hub Asal ${p.origin}`, location: `Hub ${p.origin}`, actor: 'Petugas ••• 117', method: 'Pindai petugas', identityResult: 'match' })
  checks.push({ shipmentId, seq: 1, hub: `Hub ${p.origin}`, checkedAt: at(6), ...ref, result: 'match', officer: '••• 117' })

  events.push({ shipmentId, occurredAt: at(12), kind: 'hub_scan', title: p.transit, location: p.transit, actor: 'Petugas ••• 233', method: 'Pindai petugas', identityResult: mismatch ? 'mismatch' : 'match', isFirstMismatch: mismatch, note: mismatch ? 'Berat, ukuran, dan nomor segel berbeda dari catatan pengambilan.' : null })
  checks.push({ shipmentId, seq: 2, hub: p.transit, checkedAt: at(12), ...(mismatch ? off : ref), result: mismatch ? 'mismatch' : 'match', isFirstMismatch: mismatch, officer: '••• 233' })
  if (mismatch) anomalies.push({ shipmentId, type: 'mismatch', label: 'Identitas tidak cocok', severity: 'tinggi', hub: p.transit.replace('Hub Transit ', '').replace('Hub ', ''), detectedAt: at(12), assigneeId: adminId, deadline: new Date(now + 48 * HOUR) })

  if (p.kind === 'macet') {
    const gap = Math.round(p.ageH - 12)
    events.push({ shipmentId, occurredAt: at(12), kind: 'no_scan', title: `Tidak ada pemindaian selama ${gap} jam`, location: p.transit, gapUntil: new Date(now), note: `${p.transit} tidak memindai paket` })
    anomalies.push({ shipmentId, type: 'stuck', label: `Macet, tanpa pindai ${gap} jam`, severity: 'sedang', hub: p.transit.replace('Hub Transit ', '').replace('Hub ', ''), detectedAt: at(24), assigneeId: adminId, deadline: new Date(now + 36 * HOUR) })
  }
  if (p.kind === 'perjalanan' || p.kind === 'tidak_cocok' || p.kind === 'macet') return { events, checks, anomalies, evidence }

  events.push({ shipmentId, occurredAt: at(20), kind: 'hub_scan', title: `Tiba di ${destHub}`, location: destHub, actor: 'Petugas ••• 305', method: 'Pindai petugas', identityResult: 'match' })
  checks.push({ shipmentId, seq: 3, hub: destHub, checkedAt: at(20), ...ref, result: 'match', officer: '••• 305' })
  events.push({ shipmentId, occurredAt: at(p.kind === 'pengantaran' ? p.ageH - 2 : 26), kind: 'out_for_delivery', title: 'Dalam pengantaran', location: p.destination, actor: 'Kurir ••• 481', method: 'Pindai QR label' })
  if (p.kind === 'pengantaran') return { events, checks, anomalies, evidence }

  const deliveredAt = at(Math.min(p.ageH - 1, 36))
  if (p.kind === 'diterima') {
    events.push({ shipmentId, occurredAt: deliveredAt, kind: 'delivered', title: 'Diterima', location: `${p.destination} (perkiraan)`, actor: 'Penerima', method: 'Verifikasi OTP' })
    evidence.push({ shipmentId, ownerType: 'courier', kind: 'handover', mediaType: 'none', source: 'courier', fileName: 'Catatan serah terima', meta: JSON.stringify({ metode: 'Konfirmasi OTP', lokasi: `${p.destination} (perkiraan)` }), createdAt: deliveredAt, lockedAt: deliveredAt })
  } else {
    events.push({ shipmentId, occurredAt: deliveredAt, kind: 'delivered', title: 'Diterima', location: p.destination, actor: 'Petugas', method: 'Pembaruan manual, tanpa bukti' })
    anomalies.push({ shipmentId, type: 'no_proof', label: 'Diterima tanpa bukti', severity: 'sedang', hub: p.destination, detectedAt: deliveredAt, assigneeId: adminId, deadline: new Date(now + 60 * HOUR) })
  }
  return { events, checks, anomalies, evidence }
}
