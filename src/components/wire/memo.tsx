'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useWireTarget } from './pending'

/**
 * Ingatan bentuk halaman untuk wireframe.
 * Halaman menulis "bentuk" kontennya (jumlah baris, ada/tidaknya spanduk, dll.) setelah tampil;
 * wireframe pemuatan berikutnya untuk URL yang sama membaca bentuk itu agar kerangkanya
 * sesuai dengan konten yang akan muncul. Hanya angka, tanpa data pribadi, di sessionStorage.
 */
export type Shape = Record<string, number>

const PREFIX = 'es-wire:'

const qs = (search: string) => {
  const s = new URLSearchParams(search).toString()
  return s ? `?${s}` : ''
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

/** Tulis bentuk halaman. `scope` default: path + query saat ini. */
export function WireMemo({ shape, scope }: { shape: Shape; scope?: string }) {
  const json = JSON.stringify(shape)
  useEffect(() => {
    const key = scope ?? location.pathname + qs(location.search)
    try {
      const prev = JSON.parse(sessionStorage.getItem(PREFIX + key) || '{}') as Shape
      sessionStorage.setItem(PREFIX + key, JSON.stringify({ ...prev, ...(JSON.parse(json) as Shape) }))
    } catch {
      /* penyimpanan tidak tersedia: wireframe memakai bentuk bawaan */
    }
  }, [json, scope])
  return null
}

const noop = () => () => {}

/** Rute tujuan (pathname + query) saat wireframe ditampilkan. */
export function useWireRoute() {
  const pathname = usePathname() || '/'
  const params = useSearchParams()
  const target = useWireTarget()
  if (target) return target
  return { pathname, params: params ?? new URLSearchParams(), key: pathname + qs(params?.toString() ?? '') }
}

/** Baca bentuk yang diingat; selama SSR/kunjungan pertama mengembalikan {} (pakai bawaan). */
export function useShape(scope?: string): Shape {
  const { key } = useWireRoute()
  const k = scope ?? key
  const raw = useSyncExternalStore(noop, () => read(k), () => null)
  return useMemo(() => {
    try {
      return raw ? (JSON.parse(raw) as Shape) : {}
    } catch {
      return {}
    }
  }, [raw])
}

/** Ambil angka dari bentuk dengan batas wajar (-1 = "tidak ada", untuk indeks). */
export const pick = (s: Shape, k: string, fallback: number, max = 12) => {
  const v = s[k]
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(-1, Math.min(max, Math.round(v))) : fallback
}
