import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Icon, type IconName } from './icon'
import type { Tone } from '@/lib/labels'
import { PendingLink } from './wire/pending'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const TONE: Record<Tone, { chip: string; banner: string; dot: string; text: string }> = {
  ok: { chip: 'bg-ok-bg text-ok', banner: 'bg-ok-bg/70 border-ok', dot: 'bg-ok-bg text-ok border-ok', text: 'text-ok' },
  wn: { chip: 'bg-wn-bg text-wn', banner: 'bg-wn-bg/70 border-wn', dot: 'bg-wn-bg text-wn border-wn', text: 'text-wn' },
  er: { chip: 'bg-er-bg text-er', banner: 'bg-er-bg/70 border-er', dot: 'bg-er-bg text-er border-er', text: 'text-er' },
  nu: { chip: 'bg-nu-bg text-nu', banner: 'bg-nu-bg/80 border-nu/60', dot: 'bg-nu-bg text-nu border-nu', text: 'text-nu' },
  nb: { chip: 'bg-nb-bg text-nb', banner: 'bg-nb-bg/70 border-nb', dot: 'bg-nb-bg text-nb border-nb', text: 'text-nb' },
}
export const toneText = (t: Tone) => TONE[t].text

export function Chip({ tone = 'nu', icon, children, className }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-semibold whitespace-nowrap', TONE[tone].chip, className)}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.2} />}
      {children}
    </span>
  )
}

export function Banner({ tone = 'nb', icon, children, className, role }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string; role?: string }) {
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-r border-l-2 px-4 py-3 text-txt', TONE[tone].banner, className)}>
      {icon && <span className={cx('mt-0.5', TONE[tone].text)}><Icon name={icon} size={18} /></span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'white' | 'danger' | 'ghost'
const BTN: Record<Variant, string> = {
  primary: 'bg-navy text-white border border-navy hover:bg-navy-d hover:border-navy-d disabled:bg-[#8795AD] disabled:border-[#8795AD]',
  secondary: 'bg-white text-navy border border-line-d hover:border-navy disabled:text-[#8795AD] disabled:border-line disabled:bg-white',
  white: 'bg-white text-navy border border-white hover:bg-nb-bg hover:border-nb-bg',
  danger: 'bg-white text-er border border-er/40 hover:border-er hover:bg-er-bg disabled:opacity-50',
  ghost: 'bg-transparent text-nu border border-transparent hover:bg-nu-bg hover:text-navy',
}
export const btnClass = (v: Variant = 'primary', extra?: string | false, size: 'md' | 'sm' = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-r font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-150 select-none',
    size === 'md' ? 'min-h-11 px-[18px] text-[14px]' : 'min-h-9 px-3 text-[13px]',
    BTN[v],
    extra,
  )

export function Button({ variant = 'primary', size = 'md', icon, children, className, ...rest }: ComponentProps<'button'> & { variant?: Variant; size?: 'md' | 'sm'; icon?: IconName }) {
  return (
    <button type="button" className={btnClass(variant, className, size)} {...rest}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  )
}

export function LinkButton({ variant = 'primary', size = 'md', icon, iconRight, children, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: 'md' | 'sm'; icon?: IconName; iconRight?: IconName }) {
  return (
    <Link className={btnClass(variant, className, size)} {...rest}>
      {icon && <Icon name={icon} size={17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={17} />}
    </Link>
  )
}

export function Card({ children, className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('card', className)} {...rest}>{children}</div>
}

export function Stamp({ children }: { children: ReactNode }) {
  return (
    <p className="stamp">
      <Icon name="shield" size={16} className="mt-px" />
      <span>{children}</span>
    </p>
  )
}

export function Placeholder({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('ph', className)}>{children}</div>
}

/** Foto bukti dari /api/evidence/[id]/file; tanpa src tampil keadaan kosong yang jujur. */
export function EvidencePhoto({ src, alt, className, emptyText = 'Foto belum dilampirkan kurir' }: { src?: string | null; alt: string; className?: string; emptyText?: string }) {
  if (!src) {
    return (
      <div className={cx('ph flex-col gap-1 px-2 text-center font-normal', className)}>
        <Icon name="image" size={22} />
        <span className="text-[13px]">{emptyText}</span>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <a href={src} target="_blank" rel="noopener noreferrer" className={cx('block overflow-hidden rounded-r bg-nu-bg', className)}><img src={src} alt={alt} className="size-full object-cover" loading="lazy" /></a>
}

export function ProgressBar({ value, tone = 'navy', label }: { value: number; tone?: 'navy' | 'ok' | 'wn' | 'er'; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const bg = { navy: 'bg-navy', ok: 'bg-ok', wn: 'bg-wn', er: 'bg-er' }[tone]
  return (
    <div className="h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i className={cx('block h-full rounded-full', bg)} style={{ width: `${v}%` }} />
    </div>
  )
}

export function FilterChip({ href, on, children }: { href: string; on?: boolean; children: ReactNode }) {
  return (
    <PendingLink
      href={href}
      aria-current={on ? 'true' : undefined}
      className={cx(
        'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 font-semibold whitespace-nowrap transition-[background-color,border-color,color,opacity] data-[pending]:opacity-60',
        on ? 'border-navy bg-navy text-white' : 'border-line-d bg-white text-nu hover:bg-nu-bg',
      )}
    >
      {children}
    </PendingLink>
  )
}

/** Item linimasa: simpul kecil pada garis bukti. Ikon hanya untuk anomali. */
export function TimelineItem({ tone, icon, dashed, last, children }: { tone: Tone; icon: IconName; dashed?: boolean; last?: boolean; children: ReactNode }) {
  const loud = tone === 'er' || tone === 'wn'
  return (
    <li className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="absolute top-[22px] bottom-0 left-[9.5px] w-px"
          style={{ background: dashed ? 'repeating-linear-gradient(var(--color-wn) 0 3px, transparent 3px 7px)' : 'var(--color-line-d)' }}
        />
      )}
      <span aria-hidden className="relative z-[1] grid h-[22px] place-items-center">
        {loud ? (
          <span className={cx('grid size-5 place-items-center rounded-full border', TONE[tone].dot, dashed && 'border-dashed')}>
            <Icon name={icon} size={11} strokeWidth={2.6} />
          </span>
        ) : tone === 'ok' ? (
          <span className="size-2.5 rounded-full bg-navy ring-4 ring-white" />
        ) : (
          <span className="size-2.5 rounded-full border-[1.5px] border-navy bg-white ring-4 ring-white" />
        )}
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  )
}

/** Tahapan sebagai garis bukti horizontal. */
export function Stepper({ steps, current, done }: { steps: readonly string[]; current: number; done?: boolean }) {
  return (
    <ol className="flex">
      {steps.map((label, i) => {
        const state = i < current || (done && i === current) ? 'done' : i === current ? 'cur' : 'todo'
        return (
          <li key={label} className={cx('relative flex flex-1 flex-col items-start gap-2.5 pr-2 text-[13px] leading-snug', state === 'todo' ? 'text-mut' : state === 'cur' ? 'font-semibold text-navy' : 'text-txt')}>
            {i < steps.length - 1 && (
              <span aria-hidden className={cx('absolute top-[5.5px] right-0 left-3 h-px', i < current || done ? 'bg-navy' : 'bg-line-d')} />
            )}
            <span
              aria-hidden
              className={cx(
                'relative z-[1] size-3 rounded-full',
                state === 'done' ? 'bg-navy' : state === 'cur' ? 'border-[1.5px] border-navy bg-white ring-4 ring-nb-bg' : 'border-[1.5px] border-line-d bg-white',
              )}
            />
            {label}
            {state === 'cur' && <span className="sr-only">(tahap saat ini)</span>}
            {state === 'done' && <span className="sr-only">(selesai)</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <div className="kv">
      {rows.map(([k, v], i) => (
        <FragmentPair key={i} k={k} v={v} />
      ))}
    </div>
  )
}
function FragmentPair({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <>
      <span>{k}</span>
      <span className="min-w-0 break-words">{v}</span>
    </>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('text-[17px] font-semibold', className)}>{children}</h2>
}

/** Judul bagian dengan aksi opsional di kanan. */
export function SectionHeader({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-x-6 gap-y-2', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-[21px] leading-tight font-semibold">{title}</h2>
        {children && <p className="max-w-[60ch] text-mut">{children}</p>}
      </div>
      {action}
    </div>
  )
}

/** Keterangan tambahan sebagai rangkaian kecil berjarak (pengganti " · "). */
export function Meta({ items, className }: { items: ReactNode[]; className?: string }) {
  const list = items.filter((x) => x !== null && x !== undefined && x !== false && x !== '')
  return (
    <p className={cx('flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-mut', className)}>
      {list.map((x, i) => <span key={i} className="min-w-0">{x}</span>)}
    </p>
  )
}

export function EmptyState({ icon = 'box', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-p border border-dashed border-line-d px-6 py-10">
      <span className="text-navy/70"><Icon name={icon} size={22} strokeWidth={1.5} /></span>
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-mut">{children}</div>}
    </div>
  )
}
