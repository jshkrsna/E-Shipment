import { ViewTransition, type ReactNode } from 'react'

/**
 * Konten halaman "tinta masuk" setelah wireframe pemuatan memudar.
 * Dipasang di tiap page.tsx (bukan layout: layout menetap, jadi enter tak pernah terpicu).
 */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="ink-in" default="none">
      {children}
    </ViewTransition>
  )
}
