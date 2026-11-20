const TZ = 'Asia/Jakarta'
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function parts(input: Date | string | number) {
  const dt = new Date(input)
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(dt)
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value ?? 0)
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, mi: get('minute'), s: get('second') }
}
const pad = (n: number) => String(n).padStart(2, '0')

/** 24 Jul 2026 */
export function fmtDate(input: Date | string | number) {
  const p = parts(input)
  return `${p.d} ${BULAN[p.m - 1]} ${p.y}`
}
/** 14:02 */
export function fmtTime(input: Date | string | number) {
  const p = parts(input)
  return `${pad(p.h)}:${pad(p.mi)}`
}
/** 24 Jul 2026, 14:02 */
export function fmtDateTime(input: Date | string | number) {
  return `${fmtDate(input)}, ${fmtTime(input)}`
}
/** 24 Jul 2026, 14:02:11 */
export function fmtStamp(input: Date | string | number) {
  const p = parts(input)
  return `${fmtDate(input)}, ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`
}
/** 24 Jul, 14:02 */
export function fmtShort(input: Date | string | number) {
  const p = parts(input)
  return `${p.d} ${BULAN[p.m - 1]}, ${pad(p.h)}:${pad(p.mi)}`
}
/** "Hari ini, 09:41" / "Kemarin, 16:30" / "6 Nov, 11:05" */
export function fmtRelativeDay(input: Date | string | number, now = new Date()) {
  const a = parts(input)
  const b = parts(now)
  const y = parts(new Date(now.getTime() - 86400_000))
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `Hari ini, ${fmtTime(input)}`
  if (a.y === y.y && a.m === y.m && a.d === y.d) return `Kemarin, ${fmtTime(input)}`
  return fmtShort(input)
}

export function rupiah(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 'Rp0'
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

export function kg(n: number | null | undefined) {
  if (n == null) return '–'
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg'
}

export function dims(l?: number | null, w?: number | null, h?: number | null) {
  if (l == null || w == null || h == null) return '–'
  return `${l} × ${w} × ${h} cm`
}

/** "Dina Anggraini" → "D••• A•••" */
export function maskName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase() + '•••')
    .join(' ')
}

export function maskPhone() {
  return '••••-••••-•••'
}

/** Sisa waktu: "1 hari 6 jam" / "5 jam" / "Terlewat 3 jam" */
export function remaining(deadline: Date | string, now = new Date()) {
  const ms = new Date(deadline).getTime() - now.getTime()
  const abs = Math.abs(ms)
  const days = Math.floor(abs / 86400_000)
  const hours = Math.floor((abs % 86400_000) / 3600_000)
  const mins = Math.floor((abs % 3600_000) / 60_000)
  const txt = days > 0 ? `${days} hari ${hours} jam` : hours > 0 ? `${hours} jam` : `${mins} menit`
  return { overdue: ms < 0, text: ms < 0 ? `Terlewat ${txt}` : txt, hoursLeft: ms / 3600_000 }
}

/** Singkatan untuk tabel admin: "1 hr 6 jam" */
export function remainingShort(deadline: Date | string, now = new Date()) {
  const r = remaining(deadline, now)
  return r.text.replace(' hari ', ' hr ')
}

export function fileSize(bytes: number | null | undefined) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`
}

export function duration(sec: number | null | undefined) {
  if (!sec) return ''
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`
}
