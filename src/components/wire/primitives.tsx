import { ViewTransition, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cx } from '../ui'

/**
 * Primitif wireframe pemuatan. Setiap halaman punya kerangka sendiri (lihat site.tsx / admin.tsx)
 * yang memakai kelas tata letak yang sama dengan halaman aslinya, jadi garis yang tergambar
 * menempati posisi konten yang akan muncul. Animasi murni CSS (globals.css: .wire-*).
 */

/** Indeks urutan gambar; dibatasi agar halaman panjang tidak menunggu lama. */
export const at = (i = 0, extra?: CSSProperties) => ({ '--i': Math.min(Math.max(i, 0), 16), ...extra }) as CSSProperties

export type Tone = 'navy' | 'er' | 'wn' | 'light'
const TONE: Record<Tone, string> = { navy: '', er: 'wire-er', wn: 'wire-wn', light: 'wire-light' }

/** Pembungkus: diumumkan ke pembaca layar, memudar keluar lewat view transition. */
export function Wire({ children, className, label = 'Memuat halaman…' }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ViewTransition exit="wire-out" default="none">
      <div className={cx('wire', className)} role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{label}</span>
        {children}
      </div>
    </ViewTransition>
  )
}

/** Kotak bergaris yang menggambar dirinya sendiri. */
export function WBox({ i, className, r = 12, tone = 'navy', dashed, style, children }: { i?: number; className?: string; r?: number; tone?: Tone; dashed?: boolean; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={cx('wire-box', TONE[tone], dashed && 'wire-dashed', className)} style={{ ...at(i), ...style }}>
      <svg aria-hidden>
        <rect x="0.5" y="0.5" width="100%" height="100%" rx={r} pathLength={1} style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }} />
      </svg>
      {children}
    </div>
  )
}

/** Satu garis (teks atau pemisah). */
export function WLine({ i, w = '100%', className, tone = 'navy' }: { i?: number; w?: string | number; className?: string; tone?: Tone }) {
  return <span aria-hidden className={cx('wire-bar', TONE[tone], className)} style={at(i, { width: w })} />
}

/** Garis pemisah selebar wadah. */
export function WRule({ i, className, tone }: { i?: number; className?: string; tone?: Tone }) {
  return <WLine i={i} className={cx('block', className)} tone={tone} />
}

/** Simpul garis bukti. */
export function WNode({ i, size = 10, className, tone = 'navy' }: { i?: number; size?: number; className?: string; tone?: Tone }) {
  return <span aria-hidden className={cx('wire-node shrink-0', TONE[tone], className)} style={at(i, { width: size, height: size })} />
}

/**
 * Teks yang sudah pasti (judul statis, nomor resi/kasus dari URL, label tab):
 * tampil samar dengan tipografi yang sama seperti aslinya.
 */
export function WText({ i, as: Tag = 'span', className, children, tone = 'navy' }: { i?: number; as?: ElementType; className?: string; children: ReactNode; tone?: Tone }) {
  return (
    <Tag aria-hidden className={cx('wire-text', TONE[tone], className)} style={at(i)}>
      {children}
    </Tag>
  )
}

const WIDTHS = ['94%', '88%', '97%', '84%', '91%']

/**
 * Paragraf sebagai baris-baris garis dengan tinggi baris yang sama seperti teks aslinya.
 * `lines` = [mobile, desktop(md+)].
 */
export function WPara({ i = 0, lines = [2, 2], lh = 24, last = '58%', className, tone }: { i?: number; lines?: [number, number]; lh?: number; last?: string; className?: string; tone?: Tone }) {
  const [m, d] = lines
  const n = Math.max(m, d)
  return (
    <div aria-hidden className={cx('flex flex-col', className)}>
      {Array.from({ length: n }, (_, k) => {
        const lastM = k === m - 1
        const lastD = k === d - 1
        const vis = cx(k < m ? 'flex' : 'hidden', k < d ? 'md:flex' : 'md:hidden')
        return (
          <span key={k} className={cx('items-center', vis)} style={{ height: lh }}>
            {lastM !== lastD ? (
              <>
                <WLine i={i + k} w={last} className="md:hidden" tone={tone} />
                <WLine i={i + k} w={WIDTHS[k % WIDTHS.length]} className="hidden md:block" tone={tone} />
              </>
            ) : (
              <WLine i={i + k} w={lastM ? last : WIDTHS[k % WIDTHS.length]} tone={tone} />
            )}
          </span>
        )
      })}
    </div>
  )
}

/** Pil (chip, filter). Bisa berisi label pasti. */
export function WPill({ i, w = 96, className, children, on }: { i?: number; w?: number | string; className?: string; children?: ReactNode; on?: boolean }) {
  return (
    <WBox i={i} r={999} className={cx('inline-flex h-[26px] shrink-0 items-center justify-center px-2.5', on && 'wire-on', className)} style={children ? undefined : { width: w }}>
      {children && <WText i={i} className="text-[12px] leading-none font-semibold">{children}</WText>}
    </WBox>
  )
}

/** Tombol: tinggi 44px seperti aslinya. */
export function WBtn({ i, w, className, sm }: { i?: number; w?: number | string; className?: string; sm?: boolean }) {
  return <WBox i={i} r={6} className={cx(sm ? 'h-9' : 'h-11', 'shrink-0', className)} style={w !== undefined ? { width: w } : undefined} />
}

/** Kolom isian dengan label (dan petunjuk opsional), mengikuti .lbl + .in + .hint. */
export function WField({ i = 0, label = '34%', h = 48, hint, className }: { i?: number; label?: string; h?: number; hint?: boolean; className?: string }) {
  return (
    <div className={cx('flex flex-col', className)}>
      <span className="mb-1.5 flex h-[19.5px] items-center"><WLine i={i} w={label} /></span>
      <WBox i={i + 1} r={6} style={{ height: h }} />
      {hint && <span className="mt-1.5 flex h-[19.5px] items-center"><WLine i={i + 2} w="62%" /></span>}
    </div>
  )
}

/**
 * Linimasa garis bukti; `bad` = indeks butir ketidakcocokan (kotak bertepi merah),
 * `gap` = jeda tanpa pindai (garis putus), `lines(k)` = jumlah baris teks butir ke-k.
 */
export function WTimeline({ from = 0, n = 6, bad = -1, gap = -1, compact, lines }: { from?: number; n?: number; bad?: number; gap?: number; compact?: boolean; lines?: (k: number) => number }) {
  return (
    <ol aria-hidden className="relative m-0 list-none p-0">
      {Array.from({ length: n }, (_, k) => (
        <li key={k} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
          {k < n - 1 && <span className={cx('wire-vbar absolute top-[22px] bottom-0 left-[9.5px]', k === gap && 'wire-vbar-dashed')} style={at(from + k)} />}
          <span className="relative z-[1] grid h-[22px] place-items-center">
            <WNode i={from + k} size={k === bad || k === gap ? 18 : 10} tone={k === bad ? 'er' : 'navy'} className="bg-white" />
          </span>
          {k === bad ? (
            <WBox i={from + k} r={6} tone="er" className={cx('flex flex-col', compact ? 'gap-1 px-3 py-2' : 'gap-1.5 px-4 py-3')}>
              <WPill i={from + k} w={150} />
              <span className="flex h-6 items-center"><WLine i={from + k} w="40%" /></span>
              <span className="flex h-[21px] items-center"><WLine i={from + k + 1} w="52%" /></span>
              {!compact && <WPara i={from + k + 1} lines={[3, 1]} lh={24} last="62%" />}
            </WBox>
          ) : (
            <div className="flex flex-col">
              <span className="flex h-6 items-center"><WLine i={from + k} w={`${58 - (k % 3) * 12}%`} /></span>
              <span className="flex h-[21px] items-center"><WLine i={from + k + 1} w={`${42 + (k % 2) * 8}%`} /></span>
              {!compact && (lines ? lines(k) : k % 2 === 0 ? 3 : 2) >= 3 && <span className="flex h-[21px] items-center"><WLine i={from + k + 2} w="36%" /></span>}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Baris kunci–nilai seperti .kv. */
export function WKV({ i = 0, rows = 4 }: { i?: number; rows?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-[minmax(96px,auto)_1fr] gap-x-6 gap-y-2">
      {Array.from({ length: rows }, (_, k) => (
        <span key={k} className="contents">
          <span className="flex h-[22px] items-center"><WLine i={i + k} w={`${52 + (k % 3) * 12}px`} /></span>
          <span className="flex h-[22px] items-center"><WLine i={i + k + 1} w={`${70 - (k % 4) * 9}%`} /></span>
        </span>
      ))}
    </div>
  )
}

/** Satu baris daftar bergaris tipis: dua baris teks + pil di kanan. */
export function WRow({ i = 0, className, pill = 110, lead }: { i?: number; className?: string; pill?: number | false; lead?: boolean }) {
  return (
    <div aria-hidden className={cx('flex items-center gap-4', className)}>
      {lead && <WNode i={i} size={40} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex h-6 items-center"><WLine i={i} w={`${56 - (i % 3) * 8}%`} /></span>
        <span className="flex h-5 items-center"><WLine i={i + 1} w="38%" /></span>
      </div>
      {pill !== false && <WPill i={i + 1} w={pill} />}
    </div>
  )
}

/** Chip filter (min-h-9, seperti FilterChip); `on` = filter aktif dari URL. */
export function WFilter({ i, children, on }: { i?: number; children: ReactNode; on?: boolean }) {
  return (
    <WBox i={i} r={999} className={cx('inline-flex h-9 shrink-0 items-center px-3', on && 'wire-on')}>
      <WText i={i} className="font-semibold whitespace-nowrap">{children}</WText>
    </WBox>
  )
}

/** Stepper garis bukti (Stepper di ui.tsx) dengan label tahap yang pasti. */
export function WStepper({ i = 0, steps, current, done }: { i?: number; steps: readonly string[]; current: number; done?: boolean }) {
  return (
    <ol aria-hidden className="flex">
      {steps.map((label, k) => (
        <li key={label} className="relative flex flex-1 flex-col items-start gap-2.5 pr-2 text-[13px] leading-snug">
          {k < steps.length - 1 && <WLine i={i + k} w="auto" className="absolute top-[5.5px] right-0 left-3" />}
          <WNode i={i + k} size={12} className={cx('relative z-[1] bg-white', (k < current || done) && 'wire-node-fill')} />
          <WText i={i + k} className={k === current && !done ? 'font-semibold' : ''}>{label}</WText>
        </li>
      ))}
    </ol>
  )
}

/** Panel percakapan (CaseChat): kepala, gelembung pesan, penulis pesan. */
export function WChat({ i = 0, title, bubbles = 2, side, templates, className }: { i?: number; title: string; bubbles?: number; side?: (k: number) => number; templates?: boolean; className?: string }) {
  return (
    <div className={cx('flex min-h-0 flex-col', className)}>
      <div className="relative flex min-h-14 items-center px-5">
        <WText i={i} className="text-[17px] font-semibold">{title}</WText>
        <WRule i={i} className="absolute inset-x-0 bottom-0" />
      </div>
      <div className="flex min-h-[220px] flex-1 flex-col gap-3 p-4">
        {Array.from({ length: bubbles }, (_, k) => {
          const sd = side ? side(k) : k % 2 === 1 ? 2 : 1
          if (sd === 0) return <span key={k} className="flex h-9 items-center justify-center"><WLine i={i + k + 1} w="62%" /></span>
          const mine = sd === 2
          return (
            <div key={k} className={cx('flex w-[78%] flex-col gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
              <WLine i={i + k + 1} w="46%" />
              <WBox i={i + k + 1} r={14} className="h-[66px] w-full" />
            </div>
          )
        })}
      </div>
      <div className="relative flex flex-col gap-2 p-4">
        <WRule i={i + 3} className="absolute inset-x-0 top-0" />
        {templates && (
          <div className="flex flex-wrap gap-2">
            <WPill i={i + 3} w={128} className="!h-9" />
            <WPill i={i + 3} w={150} className="!h-9" />
            <WPill i={i + 4} w={108} className="!h-9" />
          </div>
        )}
        <span className="flex h-[19.5px] items-center"><WLine i={i + 4} w="28%" /></span>
        <WBox i={i + 4} r={6} className="h-[92px]" />
        <WBtn i={i + 5} className="w-full" />
      </div>
    </div>
  )
}
