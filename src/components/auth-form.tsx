'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { Banner, Button } from './ui'

type Mode = 'masuk' | 'daftar'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user } = await api<{ user: { role: string } }>(`/api/auth/${mode === 'masuk' ? 'login' : 'register'}`, {
        method: 'POST',
        json: mode === 'masuk' ? { email: form.email, password: form.password } : form,
      })
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
      router.push(safeNext ?? (user.role === 'ADMIN' ? '/admin' : '/kasus'))
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const q = next ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <form onSubmit={submit} className="card flex flex-col gap-4" noValidate>
      {mode === 'daftar' && (
        <>
          <div><label className="lbl" htmlFor="name">Nama lengkap</label><input id="name" className="in" value={form.name} onChange={set('name')} autoComplete="name" required /></div>
          <div>
            <label className="lbl" htmlFor="phone">Nomor WhatsApp</label>
            <input id="phone" className="in" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="081234567890" required />
            <p className="hint mt-1">Dipakai untuk kabar kasus dan klaim paket atas nama Anda.</p>
          </div>
        </>
      )}
      <div><label className="lbl" htmlFor="email">Email</label><input id="email" type="email" className="in" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
      <div>
        <label className="lbl" htmlFor="password">Kata sandi</label>
        <input id="password" type="password" className="in" value={form.password} onChange={set('password')} autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} required minLength={mode === 'daftar' ? 8 : 1} />
        {mode === 'daftar' && <p className="hint mt-1">Minimal 8 karakter.</p>}
      </div>
      {error && <Banner tone="er" icon="alert" role="alert"><p className="text-[13px]">{error}</p></Banner>}
      <Button type="submit" disabled={busy}>{busy ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Buat akun'}</Button>
      <p className="text-center text-[13px] text-mut">
        {mode === 'masuk' ? <>Belum punya akun? <Link className="lnk" href={`/daftar${q}`}>Daftar</Link></> : <>Sudah punya akun? <Link className="lnk" href={`/masuk${q}`}>Masuk</Link></>}
      </p>
    </form>
  )
}
