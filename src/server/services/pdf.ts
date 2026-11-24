import 'server-only'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { CaseBundle } from './cases'
import { categoryLabel, STATUS_DETAIL, type CategoryValue } from '@/lib/labels'
import { fmtDateTime, fmtStamp, maskName, rupiah } from '@/lib/format'

const NAVY = rgb(0x14 / 255, 0x30 / 255, 0x5b / 255)
const MUT = rgb(0x52 / 255, 0x60 / 255, 0x7a / 255)
const TXT = rgb(0x16 / 255, 0x20 / 255, 0x2e / 255)

/** Font standar PDF memakai WinAnsi: ganti karakter yang tidak didukung. */
function safe(t: string) {
  return t.replace(/→/g, '->').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x20-\x7E -ÿ•–—×]/g, '')
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const out: string[] = []
  for (const para of safe(text).split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > width && line) {
        out.push(line)
        line = word
      } else line = test
    }
    out.push(line)
  }
  return out
}

export async function caseStatementPdf(b: CaseBundle) {
  const doc = await PDFDocument.create()
  doc.setTitle(`Pernyataan kasus ${b.case.code}`)
  doc.setAuthor('E-Shipmennt')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)
  let page: PDFPage = doc.addPage([595, 842])
  const M = 48
  const W = 595 - M * 2
  let y = 842 - M

  const ensure = (h: number) => {
    if (y - h < M) {
      page = doc.addPage([595, 842])
      y = 842 - M
    }
  }
  const text = (t: string, opts: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) => {
    const f = opts.f ?? font
    const size = opts.size ?? 10
    for (const line of wrap(t, f, size, W)) {
      ensure(size + 4)
      page.drawText(line, { x: M, y: y - size, size, font: f, color: opts.color ?? TXT })
      y -= size + 4
    }
    y -= opts.gap ?? 4
  }
  const kv = (k: string, v: string) => {
    ensure(16)
    page.drawText(safe(k), { x: M, y: y - 10, size: 10, font, color: MUT })
    const lines = wrap(v, font, 10, W - 150)
    lines.forEach((l, i) => page.drawText(l, { x: M + 150, y: y - 10 - i * 14, size: 10, font, color: TXT }))
    y -= Math.max(1, lines.length) * 14 + 2
  }
  const rule = () => {
    ensure(12)
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M + W, y: y - 4 }, thickness: 0.6, color: rgb(0.85, 0.87, 0.91) })
    y -= 14
  }

  page.drawRectangle({ x: 0, y: 842 - 6, width: 595, height: 6, color: NAVY })
  text('E-Shipmennt', { f: bold, size: 12, color: NAVY, gap: 2 })
  text('PERNYATAAN KASUS', { f: bold, size: 9, color: MUT, gap: 8 })
  text(`Kasus ${b.case.code} · ${categoryLabel(b.case.category as CategoryValue, b.case.categoryOther)}`, { f: bold, size: 18, gap: 6 })
  text('Belum ada pihak yang dinyatakan bersalah selama investigasi berjalan.', { size: 10, color: MUT, gap: 10 })
  rule()
  kv('Nomor resi', b.shipment.awb)
  kv('Kurir', `${b.shipment.courier} · ${b.shipment.service}`)
  kv('Rute', `${b.shipment.origin} -> ${b.shipment.destination}`)
  kv('Nilai pesanan', rupiah(b.shipment.itemValue))
  kv('Pelapor', maskName(b.reporter.name))
  kv('Dibuka', fmtDateTime(b.case.createdAt))
  kv('Status', STATUS_DETAIL[b.case.status])
  if (b.case.cause) kv('Penyebab', b.case.cause)
  rule()
  text('Cerita pelapor', { f: bold, size: 11, gap: 2 })
  text(b.case.storyText, { gap: 10 })
  if (b.validation?.summary) {
    text('Ringkasan keputusan', { f: bold, size: 11, gap: 2 })
    text(b.validation.summary, { gap: 10 })
  }
  text('Bukti dalam kasus', { f: bold, size: 11, gap: 4 })
  for (const e of b.evidence) {
    text(`• ${e.fileName} (${e.ownerType === 'courier' ? 'dicatat kurir' : 'oleh pelapor'}) · ${fmtStamp(e.createdAt)}`, { gap: 0 })
    if (e.mediaType === 'link' && e.url) text(`  Tautan: ${e.url}`, { f: mono, size: 7.5, color: MUT, gap: 4 })
    if (e.sha256) text(`  SHA-256: ${e.sha256}`, { f: mono, size: 7.5, color: MUT, gap: 4 })
  }
  y -= 6
  text('Riwayat kasus', { f: bold, size: 11, gap: 4 })
  for (const a of [...b.audit].reverse()) text(`${fmtDateTime(a.createdAt)} · ${a.detail} (${a.actorLabel})`, { size: 9, gap: 1 })
  y -= 10
  rule()
  text(
    `Dokumen dibuat otomatis ${fmtDateTime(new Date())} WIB. Cap integritas (SHA-256) mencatat isi berkas saat diunggah; bila berkas diubah, nilainya tidak lagi cocok. Dapat dilampirkan pada banding di marketplace.`,
    { size: 8, color: MUT },
  )
  return doc.save()
}
