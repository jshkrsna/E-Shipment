import { rupiah } from './format'

export type ValidationState = {
  damaged: boolean | null
  insurance: 'asuransi' | 'tanpa_asuransi' | null
  chargeRuleId: number | null
  chargeManual: number | null
  swapped: boolean | null
}

export type Rule = { id: number; label: string; percent: number; flatAmount: number }
export type TraceLoc = { id: number; name: string; status: 'belum' | 'tidak_ada' | 'ditemukan' }

export function computeCharge(v: Pick<ValidationState, 'chargeRuleId' | 'chargeManual'>, rules: Rule[], itemValue: number) {
  if (v.chargeManual != null && v.chargeManual > 0) return Math.round(v.chargeManual)
  const rule = rules.find((r) => r.id === v.chargeRuleId)
  if (!rule) return null
  return Math.round((rule.percent / 100) * itemValue + rule.flatAmount)
}

export function isComplete(v: ValidationState, chargeTotal: number | null, trace: TraceLoc[]) {
  if (v.damaged == null || v.swapped == null) return false
  if (v.damaged) {
    if (!v.insurance) return false
    if (v.insurance === 'tanpa_asuransi' && chargeTotal == null) return false
  }
  if (v.swapped && !trace.some((t) => t.status === 'ditemukan')) return false
  return true
}

export function summaryLines(v: ValidationState, chargeTotal: number | null, trace: TraceLoc[], redeliveryLabel?: string | null) {
  const lines: string[] = []
  if (v.damaged == null && v.swapped == null) return ['Belum ada jawaban validasi.']
  if (v.damaged === true) {
    if (v.insurance === 'asuransi') lines.push('Barang rusak: diganti dengan asuransi.')
    else if (v.insurance === 'tanpa_asuransi')
      lines.push(chargeTotal != null ? `Barang rusak: tidak diganti asuransi, charge ${rupiah(chargeTotal)}.` : 'Barang rusak: tidak diganti asuransi, charge belum ditentukan.')
    else lines.push('Barang rusak: keputusan penggantian belum dipilih.')
  } else if (v.damaged === false) lines.push('Barang tidak rusak.')
  if (v.swapped === true) {
    const found = trace.find((t) => t.status === 'ditemukan')
    const checked = trace.filter((t) => t.status !== 'belum').length
    if (found) lines.push(`Barang tertukar: paket ditemukan di ${found.name}.` + (redeliveryLabel ? ` Pengiriman ulang dijadwalkan ${redeliveryLabel}.` : ''))
    else lines.push(`Barang tertukar: pelacakan berjalan (${checked} dari ${trace.length} lokasi diperiksa).`)
  } else if (v.swapped === false) lines.push('Barang tidak tertukar.')
  return lines
}
