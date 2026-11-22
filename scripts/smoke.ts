/**
 * Uji end-to-end lewat API terhadap server yang sedang berjalan.
 *   BASE_URL=http://localhost:3000 npm run smoke
 * Membuat akun baru, mengklaim JT110461625100, mengunggah bukti, melapor,
 * lalu admin menerima, memvalidasi, membalas, dan menutup laporan.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@eshipmennt.test'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345'
const AWB = 'JT110461625100'

type Jar = { cookie?: string }
let passed = 0

async function call(jar: Jar, method: string, path: string, body?: unknown, raw?: { data: Uint8Array; type: string }) {
  const headers: Record<string, string> = {}
  if (jar.cookie) headers.cookie = jar.cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (raw) headers['content-type'] = raw.type
  const res = await fetch(BASE + path, { method, headers, body: raw ? (raw.data as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' })
  const set = res.headers.get('set-cookie')
  if (set) jar.cookie = set.split(';')[0]
  const type = res.headers.get('content-type') || ''
  const data = type.includes('json') ? await res.json() : await res.arrayBuffer()
  return { status: res.status, data: data as any, type } // eslint-disable-line @typescript-eslint/no-explicit-any
}

function check(name: string, cond: unknown, detail?: unknown) {
  if (!cond) {
    console.error(`✗ ${name}`, detail ?? '')
    process.exit(1)
  }
  passed++
  console.log(`✓ ${name}`)
}

// PNG 1×1
const PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'))

async function upload(jar: Jar, name: string) {
  const meta = { awb: AWB, fileName: name, mime: 'image/png', size: PNG.length }
  const u = await call(jar, 'POST', '/api/evidence/upload-url', meta)
  check(`URL unggah ${name}`, u.status === 200, u.data)
  const url = u.data.uploadUrl.startsWith('http') ? u.data.uploadUrl : BASE + u.data.uploadUrl
  const put = await fetch(url, { method: 'PUT', body: PNG as BodyInit, headers: { 'content-type': 'image/png', ...u.data.headers } })
  check(`PUT berkas ${name}`, put.ok, put.status)
  const r = await call(jar, 'POST', '/api/evidence', { ...meta, key: u.data.key })
  check(`Daftarkan ${name} + SHA-256`, r.status === 200 && r.data.evidence.sha256?.length === 64, r.data)
  return r.data.evidence.id as number
}

async function main() {
  const user: Jar = {}
  const admin: Jar = {}
  const email = `uji.${Date.now()}@eshipmennt.test`

  let r = await call(user, 'POST', '/api/auth/register', { name: 'Penguji Demo', email, phone: '089900001234', password: 'rahasia123' })
  check('Daftar akun Pengguna', r.status === 200 && r.data.user.role === 'PENGGUNA', r.data)

  r = await call(user, 'GET', `/api/shipments/${AWB}`)
  check('Lacak resi (publik)', r.status === 200 && r.data.shipment.awb === AWB, r.data)

  r = await call(user, 'POST', `/api/shipments/${AWB}/claim`, { last4: '0000' })
  if (r.status === 409) {
    console.log('ℹ Paket demo sudah diklaim pada uji sebelumnya. Jalankan `npm run db:reset` untuk mengulang dari awal.')
    process.exit(0)
  }
  check('Klaim dengan digit salah ditolak', r.status === 400, r.data)
  r = await call(user, 'POST', `/api/shipments/${AWB}/claim`, { last4: '1234' })
  check('Klaim paket', r.status === 200, r.data)

  const ev1 = await upload(user, 'unboxing-1.png')
  const ev2 = await upload(user, 'unboxing-2.png')
  r = await call(user, 'DELETE', `/api/evidence/${ev2}`)
  check('Hapus berkas yang belum dilaporkan', r.status === 200, r.data)

  r = await call(user, 'GET', `/api/evidence/${ev1}/file`)
  check('Unduh berkas sebagai pemilik', r.status === 200 && r.type.startsWith('image/png'))
  r = await call({}, 'GET', `/api/evidence/${ev1}/file`)
  check('Unduh berkas tanpa izin ditolak', r.status === 403)

  r = await call(user, 'POST', '/api/cases', { awb: AWB, category: 'LAINNYA', categoryOther: '', storyHtml: '<p>Kemasan <strong>basah</strong></p><ol><li data-list="bullet">Isi aman</li></ol>', evidenceIds: [ev1], contactChannel: 'email' })
  check('P3: “Lainnya” kosong ditolak', r.status === 422, r.data)
  r = await call(user, 'POST', '/api/cases', { awb: AWB, category: 'RUSAK', storyHtml: '<p>Kemasan <strong>basah dan penyok</strong> saat tiba.</p><script>alert(1)</script><ol><li data-list="bullet">Isi rusak</li></ol>', evidenceIds: [ev1], contactChannel: 'email' })
  check('Kirim laporan (P2 rich text)', r.status === 200 && /^KS-\d{4}$/.test(r.data.code), r.data)
  const code = r.data.code as string

  r = await call(user, 'GET', `/api/cases/${code}`)
  check('HTML cerita disanitasi', r.status === 200 && !r.data.case.storyHtml.includes('<script') && r.data.case.storyHtml.includes('<strong>'), r.data.case?.storyHtml)
  r = await call(user, 'DELETE', `/api/evidence/${ev1}`)
  check('Berkas terkunci tidak bisa dihapus', r.status === 409, r.data)

  r = await call(user, 'GET', '/api/admin/cases')
  check('Pengguna ditolak di API admin', r.status === 403)

  r = await call(admin, 'POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  check('Admin masuk', r.status === 200 && r.data.user.role === 'ADMIN', r.data)
  r = await call(admin, 'GET', '/api/admin/cases?status=baru')
  check('Laporan muncul sebagai Baru', r.data.items.some((i: { code: string }) => i.code === code))

  r = await call(admin, 'PUT', `/api/admin/cases/${code}/validation`, { damaged: true, insurance: null, chargeRuleId: null, chargeManual: null, swapped: null })
  check('Validasi sebelum diterima ditolak', r.status === 409, r.data)
  r = await call(admin, 'POST', `/api/admin/cases/${code}/accept`)
  check('A1: Terima laporan', r.status === 200, r.data)

  const detail = await call(admin, 'GET', `/api/admin/cases/${code}`)
  const rule = detail.data.rules[0]
  r = await call(admin, 'PUT', `/api/admin/cases/${code}/validation`, { damaged: true, insurance: 'tanpa_asuransi', chargeRuleId: rule.id, chargeManual: null, swapped: true })
  check('A2: charge dihitung otomatis', r.status === 200 && r.data.chargeTotal === Math.round((rule.percent / 100) * 180000 + rule.flatAmount), r.data)
  check('A2: belum lengkap sebelum paket ditemukan', r.data.complete === false)
  r = await call(admin, 'POST', `/api/admin/cases/${code}/close`, {})
  check('Tutup ditolak saat validasi belum lengkap', r.status === 409, r.data)

  const d2 = await call(admin, 'GET', `/api/admin/cases/${code}`)
  check('A2: daftar lokasi pelacakan dibuat', d2.data.trace.length >= 2, d2.data.trace)
  const loc = d2.data.trace[1]
  r = await call(admin, 'PUT', `/api/admin/cases/${code}/trace/${d2.data.trace[0].id}`, { status: 'tidak_ada' })
  r = await call(admin, 'PUT', `/api/admin/cases/${code}/trace/${loc.id}`, { status: 'ditemukan' })
  check('A2: paket ditemukan → validasi lengkap', r.status === 200 && r.data.complete === true, r.data)
  r = await call(admin, 'POST', `/api/admin/cases/${code}/redelivery`, { date: new Date(Date.now() + 2 * 86400_000).toISOString() })
  check('Jadwalkan pengiriman ulang', r.status === 200, r.data)

  r = await call(admin, 'POST', `/api/cases/${code}/messages`, { body: 'Terima kasih, laporan Anda sudah kami terima dan sedang diperiksa.' })
  check('A3: Kirim reply', r.status === 200, r.data)
  r = await call(admin, 'POST', `/api/admin/cases/${code}/decision`)
  check('Kirim keputusan ke pelapor', r.status === 200, r.data)

  r = await call(user, 'GET', `/api/cases/${code}/messages`)
  check('Pelapor menerima reply & keputusan', r.data.messages.some((m: { senderRole: string }) => m.senderRole === 'admin') && r.data.messages.some((m: { kind: string }) => m.kind === 'keputusan'))
  r = await call(user, 'POST', `/api/cases/${code}/messages`, { body: 'Baik, terima kasih.' })
  check('Pelapor membalas', r.status === 200)

  r = await call(user, 'POST', `/api/cases/${code}/share`)
  check('Buat tautan bukti', r.status === 200 && r.data.token, r.data)
  const token = r.data.token
  r = await call({}, 'GET', `/bukti/${token}`)
  check('Tampilan bukti bersama (tanpa login)', r.status === 200)
  r = await call({}, 'GET', `/api/evidence/${ev1}/file?share=${token}`)
  check('Berkas lewat tautan bukti', r.status === 200)

  r = await call(user, 'GET', `/api/cases/${code}/statement`)
  check('Unduh pernyataan PDF', r.status === 200 && r.type === 'application/pdf')

  r = await call(admin, 'POST', `/api/admin/cases/${code}/close`, { cause: 'Kemasan tidak memadai, barang rusak di hub transit.' })
  check('Tutup laporan', r.status === 200, r.data)
  r = await call(user, 'GET', `/api/cases/${code}`)
  check('Status kasus Selesai di sisi pengguna', r.data.case.status === 'SELESAI')

  r = await call(admin, 'POST', '/api/admin/scans', { awb: AWB, hub: 'Hub Transit Cikarang', weightKg: 0.9, lengthCm: 20, widthCm: 20, heightCm: 10, sealNo: 'SEG-11111' })
  check('Pindai checkpoint: deteksi tidak cocok', r.status === 200 && r.data.result === 'mismatch' && r.data.diffs.length === 3, r.data)

  r = await call(admin, 'POST', '/api/admin/incidents', { caseCode: code, type: 'Lainnya', title: 'Kemasan rusak di hub transit', cause: 'Kemasan tidak memadai', fix: 'Pemeriksaan kemasan di hub asal', resolutionDays: 1 })
  check('Publikasikan insiden dari kasus selesai', r.status === 200 && /^INC-/.test(r.data.incident.code), r.data)

  // ── Edit profil (Pengguna & Admin) ─────────────────
  r = await call({}, 'PATCH', '/api/auth/me', { name: 'X Y', email, phone: '081234567890' })
  check('Profil: tanpa login ditolak', r.status === 401, r.data)
  r = await call({}, 'POST', '/api/auth/password', { password: 'rahasiaBaru1', confirm: 'rahasiaBaru1' })
  check('Kata sandi: tanpa login ditolak', r.status === 401, r.data)

  const user2: Jar = {}
  r = await call(user2, 'POST', '/api/auth/login', { email, password: 'rahasia123' })
  check('Masuk di perangkat kedua', r.status === 200, r.data)

  r = await call(user, 'PATCH', '/api/auth/me', { name: 'Penguji Diubah', email: email.toUpperCase(), phone: '6281299998888' })
  check('Profil: ubah nama, email, nomor', r.status === 200 && r.data.user.name === 'Penguji Diubah' && r.data.user.email === email && r.data.user.phone === '081299998888', r.data)
  r = await call(user, 'PATCH', '/api/auth/me', { name: 'Penguji Diubah', email: ADMIN_EMAIL, phone: '081299998888' })
  check('Profil: email milik akun lain ditolak', r.status === 409, r.data)
  r = await call(user, 'PATCH', '/api/auth/me', { name: 'Penguji Diubah', email, phone: '' })
  check('Profil: nomor wajib untuk Pengguna', r.status === 422, r.data)

  r = await call(user, 'POST', '/api/auth/password', { password: 'rahasiaBaru1', confirm: 'beda12345' })
  check('Kata sandi: konfirmasi tidak cocok ditolak', r.status === 422, r.data)
  r = await call({}, 'POST', '/api/auth/login', { email, password: 'rahasia123' })
  check('Kata sandi lama masih berlaku setelah penolakan', r.status === 200, r.data)
  r = await call(user, 'POST', '/api/auth/password', { password: 'rahasiaBaru1', confirm: 'rahasiaBaru1' })
  check('Kata sandi: diganti', r.status === 200, r.data)
  r = await call(user, 'GET', '/api/auth/me')
  check('Sesi yang mengganti tetap masuk', r.data.user?.email === email, r.data)
  r = await call(user2, 'GET', '/api/auth/me')
  check('Sesi perangkat lain dikeluarkan', r.data.user === null, r.data)
  r = await call({}, 'POST', '/api/auth/login', { email, password: 'rahasia123' })
  check('Kata sandi lama tidak berlaku', r.status === 400, r.data)
  r = await call({}, 'POST', '/api/auth/login', { email, password: 'rahasiaBaru1' })
  check('Masuk dengan kata sandi baru', r.status === 200, r.data)

  r = await call(admin, 'GET', '/api/auth/me')
  const adminName = r.data.user.name as string
  r = await call(admin, 'PATCH', '/api/auth/me', { name: 'Admin Uji', email: ADMIN_EMAIL, phone: '' })
  check('Profil admin: nomor boleh kosong', r.status === 200 && r.data.user.name === 'Admin Uji' && r.data.user.phone === null, r.data)
  r = await call(admin, 'PATCH', '/api/auth/me', { name: adminName, email: ADMIN_EMAIL, phone: '' })
  check('Profil admin: nama dikembalikan', r.status === 200 && r.data.user.name === adminName, r.data)

  r = await call(user, 'POST', '/api/auth/logout')
  r = await call(user, 'GET', '/api/auth/me')
  check('Keluar', r.data.user === null)

  console.log(`\nSemua ${passed} pemeriksaan lulus. Kasus uji: ${code}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
