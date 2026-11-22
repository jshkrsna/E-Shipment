import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Icon, type IconName } from './icon'
import type { Tone } from '@/lib/labels'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const TONE: Record<Tone, { chip: string; banner: string; dot: string; text: string }> = {
  ok: { chip: 'bg-ok-bg text-ok', banner: 'bg-ok-bg border-ok/35', dot: 'bg-ok-bg text-ok border-ok', text: 'text-ok' },
  wn: { chip: 'bg-wn-bg text-wn', banner: 'bg-wn-bg border-wn/35', dot: 'bg-wn-bg text-wn border-wn', text: 'text-wn' },
  er: { chip: 'bg-er-bg text-er', banner: 'bg-er-bg border-er/35', dot: 'bg-er-bg text-er border-er', text: 'text-er' },
  nu: { chip: 'bg-nu-bg text-nu', banner: 'bg-nu-bg border-nu/35', dot: 'bg-nu-bg text-nu border-nu', text: 'text-nu' },
  nb: { chip: 'bg-nb-bg text-nb', banner: 'bg-nb-bg border-nb/35', dot: 'bg-nb-bg text-nb border-nb', text: 'text-nb' },
}
export const toneText = (t: Tone) => TONE[t].text

export function Chip({ tone = 'nu', icon, children, className }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] leading-5 font-bold whitespace-nowrap', TONE[tone].chip, className)}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.4} />}
      {children}
    </span>
  )
}

export function Banner({ tone = 'nb', icon, children, className, role }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string; role?: string }) {
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-r border px-4 py-3 text-txt', TONE[tone].banner, className)}>
      {icon && <span className={cx('mt-px', TONE[tone].text)}><Icon name={icon} size={20} /></span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'white' | 'danger' | 'ghost'
const BTN: Record<Variant, string> = {
  primary: 'bg-navy text-white border border-navy hover:bg-navy-d disabled:bg-[#8795AD] disabled:border-[#8795AD]',
  secondary: 'bg-white text-navy border border-navy hover:bg-nb-bg disabled:text-[#8795AD] disabled:border-[#B7C2D3] disabled:bg-white',
  white: 'bg-white text-navy border border-white hover:bg-nb-bg',
  danger: 'bg-white text-er border border-er hover:bg-er-bg disabled:opacity-50',
  ghost: 'bg-transparent text-nu border border-transparent hover:bg-nu-bg',
}
export const btnClass = (v: Variant = 'primary', extra?: string | false, size: 'md' | 'sm' = 'md') =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-r font-semibold whitespace-nowrap transition-colors select-none',
    size === 'md' ? 'min-h-11 px-4' : 'min-h-9 px-3 text-[13px]',
    BTN[v],
    extra,
  )

export function Button({ variant = 'primary', size = 'md', icon, children, className, ...rest }: ComponentProps<'button'> & { variant?: Variant; size?: 'md' | 'sm'; icon?: IconName }) {
  return (
    <button type="button" className={btnClass(variant, className, size)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

export function LinkButton({ variant = 'primary', size = 'md', icon, iconRight, children, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: 'md' | 'sm'; icon?: IconName; iconRight?: IconName }) {
  return (
    <Link className={btnClass(variant, className, size)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
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
        <span className="text-[12px]">{emptyText}</span>
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
    <div className="h-2 overflow-hidden rounded-full bg-nu-bg" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i className={cx('block h-full rounded-full', bg)} style={{ width: `${v}%` }} />
    </div>
  )
}

export function FilterChip({ href, on, children }: { href: string; on?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={on ? 'true' : undefined}
      className={cx(
        'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 font-semibold whitespace-nowrap',
        on ? 'border-navy bg-navy text-white' : 'border-line-d bg-white text-nu hover:bg-nu-bg',
      )}
    >
      {children}
    </Link>
  )
}

/** Item linimasa. */
export function TimelineItem({ tone, icon, dashed, last, children }: { tone: Tone; icon: IconName; dashed?: boolean; last?: boolean; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="absolute top-[30px] bottom-0.5 left-[13px] w-0.5"
          style={{ background: dashed ? 'repeating-linear-gradient(var(--color-wn) 0 4px, transparent 4px 8px)' : 'var(--color-line)' }}
        />
      )}
      <span className={cx('z-[1] grid size-7 place-items-center rounded-full border-2', TONE[tone].dot, dashed && 'border-dashed')}>
        <Icon name={icon} size={14} strokeWidth={2.6} />
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  )
}

export function Stepper({ steps, current, done }: { steps: readonly string[]; current: number; done?: boolean }) {
  return (
    <ol className="flex">
      {steps.map((label, i) => {
        const state = i < current || (done && i === current) ? 'done' : i === current ? 'cur' : 'todo'
        return (
          <li key={label} className={cx('relative flex flex-1 flex-col items-center gap-1 text-center text-[12px] font-semibold', state === 'done' ? 'text-ok' : state === 'cur' ? 'text-navy' : 'text-mut')}>
            {i > 0 && <span aria-hidden className={cx('absolute top-[13px] right-1/2 h-0.5 w-full', state === 'todo' ? 'bg-line' : 'bg-ok')} />}
            <span
              className={cx(
                'relative z-[1] grid size-7 place-items-center rounded-full border-2',
                state === 'done' ? 'border-ok bg-ok text-white' : state === 'cur' ? 'border-navy bg-navy text-white' : 'border-line-d bg-white',
              )}
            >
              {state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : state === 'cur' ? <Icon name="clock" size={14} strokeWidth={2.6} /> : null}
            </span>
            {label}
            {state === 'cur' && <span className="sr-only">(tahap saat ini)</span>}
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
  return <h2 className={cx('text-[16px] font-bold', className)}>{children}</h2>
}

export function EmptyState({ icon = 'box', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-r border border-dashed border-line-d bg-white px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-nu-bg text-nu"><Icon name={icon} size={22} /></span>
      <p className="font-bold">{title}</p>
      {children && <div className="max-w-sm text-mut">{children}</div>}
    </div>
  )
}
