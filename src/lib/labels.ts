export type Tone = 'ok' | 'wn' | 'er' | 'nu' | 'nb'

export const CATEGORY_OPTIONS = [
  { value: 'TIDAK_DITERIMA', label: 'Paket tidak diterima' },
  { value: 'TERTUKAR', label: 'Barang tertukar atau tidak sesuai pesanan' },
  { value: 'RUSAK', label: 'Barang rusak' },
  { value: 'STATUS_TIDAK_SESUAI', label: 'Status pengiriman tidak sesuai' },
  { value: 'DITUDUH', label: 'Saya dituduh melakukan kecurangan' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const

export type CategoryValue = (typeof CATEGORY_OPTIONS)[number]['value']

const SHORT: Record<CategoryValue, string> = {
  TIDAK_DITERIMA: 'Paket tidak diterima',
  TERTUKAR: 'Barang tertukar',
  RUSAK: 'Barang rusak',
  STATUS_TIDAK_SESUAI: 'Status tidak sesuai',
  DITUDUH: 'Dituduh curang',
  LAINNYA: 'Lainnya',
}

export function categoryLabel(cat: CategoryValue, other?: string | null) {
  if (cat === 'LAINNYA' && other) return `Lainnya: ${other}`
  return SHORT[cat]
}

export type CaseStatus = 'BARU' | 'DIPROSES' | 'PENYEBAB_DITEMUKAN' | 'SELESAI'

/** Label 3 kelompok untuk admin (A1). */
export function adminStatus(status: CaseStatus): { label: 'Baru' | 'Diproses' | 'Selesai'; tone: Tone } {
  if (status === 'BARU') return { label: 'Baru', tone: 'wn' }
  if (status === 'SELESAI') return { label: 'Selesai', tone: 'ok' }
  return { label: 'Diproses', tone: 'nb' }
}

/** Label rinci untuk investigasi (eks O3). */
export const STATUS_DETAIL: Record<CaseStatus, string> = {
  BARU: 'Baru',
  DIPROSES: 'Sedang diselidiki',
  PENYEBAB_DITEMUKAN: 'Penyebab teridentifikasi',
  SELESAI: 'Selesai',
}

/** Stepper pengguna (C6). */
export const USER_STEPS = ['Diterima', 'Diselidiki', 'Penyebab ditemukan', 'Selesai'] as const
export function userStepIndex(status: CaseStatus) {
  return { BARU: 0, DIPROSES: 1, PENYEBAB_DITEMUKAN: 2, SELESAI: 3 }[status]
}

export const USER_STEP_TEXT: Record<CaseStatus, { title: string; body: string }> = {
  BARU: { title: 'Laporan diterima.', body: 'Laporan Anda sudah masuk dan menunggu ditinjau admin ekspedisi. Anda tidak perlu melakukan apa pun saat ini.' },
  DIPROSES: { title: 'Sedang diselidiki.', body: 'Tim membandingkan data paket saat diambil dengan hasil pindai di setiap hub. Anda tidak perlu melakukan apa pun saat ini.' },
  PENYEBAB_DITEMUKAN: { title: 'Penyebab ditemukan.', body: 'Tim sudah menemukan penyebabnya dan sedang menyiapkan penyelesaian.' },
  SELESAI: { title: 'Selesai.', body: 'Kasus sudah ditutup. Ringkasan keputusan ada di percakapan di bawah.' },
}

export const QUICK_REPLIES = [
  { label: 'Laporan diterima', text: 'Terima kasih, laporan Anda sudah kami terima dan sedang diperiksa.' },
  { label: 'Minta foto tambahan', text: 'Mohon kirimkan foto tambahan kondisi paket dan label resi agar kami dapat memeriksa lebih lanjut.' },
  { label: 'Paket dilacak', text: 'Paket Anda sedang kami lacak di setiap lokasi rute pengiriman. Kami akan mengabari hasilnya secepatnya.' },
] as const

export const MESSAGE_TEMPLATES = [
  { label: 'Investigasi berjalan', text: 'Kami menemukan ketidakcocokan identitas paket. Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan. Kami akan mengabari Anda paling lambat dalam 1 hari.' },
  { label: 'Penyebab ditemukan', text: 'Penyebab masalah sudah kami temukan. Ringkasan penyelesaian akan kami kirimkan segera.' },
] as const

export const INCIDENT_TYPES = ['Paket tertukar', 'Status tidak valid', 'Keterlambatan hub', 'Lainnya'] as const

export const JNE_CONTACT = {
  phone: '021 2927 8888',
  phoneHref: 'tel:+622129278888',
  email: 'customercare@jne.co.id',
  web: 'https://www.jne.co.id',
}
