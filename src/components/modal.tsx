'use client'

import { useEffect, useRef } from 'react'
import { Icon } from './icon'
import { cx } from './ui'

/** Dialog: tengah layar di desktop, sheet dari bawah di mobile. */
export function Modal({
  open, onClose, title, children, variant = 'auto', labelledBy,
}: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; variant?: 'auto' | 'center'; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={cx('fixed inset-0 z-[60] flex justify-center', variant === 'center' ? 'items-center p-4' : 'items-end md:items-center md:p-4')}>
      <button type="button" aria-label="Tutup" className="anim-fade absolute inset-0 bg-navy-d/45" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        className={cx(
          'relative z-[1] flex max-h-[90dvh] w-full flex-col overflow-auto bg-white shadow-[0_24px_60px_-20px_rgba(13,33,66,0.35)] outline-none',
          variant === 'center' ? 'anim-pop max-w-md rounded-p' : 'anim-sheet rounded-t-2xl md:anim-pop md:max-w-md md:rounded-p',
        )}
      >
        {title && (
          <div className="flex min-h-14 items-center justify-between gap-2 border-b border-line px-5">
            <h2 className="text-[17px] font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-r text-nu hover:bg-nu-bg" aria-label="Tutup">
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
