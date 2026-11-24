'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ComponentProps, type ReactNode } from 'react'

/**
 * Navigasi yang hanya mengubah query (tab ?tab=, filter ?f= / ?jenis=) tidak memicu loading.tsx:
 * Next.js menahan konten lama sampai yang baru siap. PendingScope menjalankan navigasi itu
 * dalam transition dan, selama menunggu, PendingBody menampilkan wireframe untuk URL tujuan.
 */

type Target = { pathname: string; params: URLSearchParams; key: string }
type Scope = { go: (href: string) => void; pending: boolean; target: Target | null }

const ScopeCtx = createContext<Scope | null>(null)
const TargetCtx = createContext<Target | null>(null)

/** URL tujuan yang sedang dimuat (dipakai useWireRoute di wireframe). */
export const useWireTarget = () => useContext(TargetCtx)

function toTarget(href: string): Target {
  const u = new URL(href, location.href)
  const s = u.searchParams.toString()
  return { pathname: u.pathname, params: u.searchParams, key: u.pathname + (s ? `?${s}` : '') }
}

export function PendingScope({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [target, setTarget] = useState<Target | null>(null)
  const go = useCallback(
    (href: string) => {
      setTarget(toTarget(href))
      start(() => router.push(href, { scroll: false }))
    },
    [router],
  )
  const value = useMemo(() => ({ go, pending, target: pending ? target : null }), [go, pending, target])
  return <ScopeCtx.Provider value={value}>{children}</ScopeCtx.Provider>
}

/** Link biasa; di dalam PendingScope klik kiri biasa dijalankan lewat transition. */
export function PendingLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const scope = useContext(ScopeCtx)
  const busy = !!scope?.target && scope.target.key === toTarget(href).key
  return (
    <Link
      href={href}
      scroll={false}
      data-pending={busy ? '' : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (!scope || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        scope.go(href)
      }}
      {...rest}
    />
  )
}

/** Konten yang diganti wireframe selama navigasi query di scope ini berlangsung. */
export function PendingBody({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const scope = useContext(ScopeCtx)
  if (!scope?.target) return <>{children}</>
  return <TargetCtx.Provider value={scope.target}>{fallback}</TargetCtx.Provider>
}
