'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/client'
import { Banner, Button } from './ui'

type ProfileUser = { name: string; email: string; phone: string | null; role: 'PENGGUNA' | 'ADMIN' }
type Status = { busy: boolean; error: string; ok: string }
const idle: Status = { busy: false, error: '', ok: '' }

function Feedback({ s }: { s: Status }) {
  if (s.error) return <Banner tone="er" icon="alert" role="alert"><p className="text-[13px]">{s.error}</p></Banner>
  if (s.ok) return <Banner tone="ok" icon="check" role="status"><p className="text-[13px]">{s.ok}</p></Banner>
  return null
}

/** Form profil akun sendiri: data akun dan ganti kata sandi (dipakai /akun dan /admin/akun). */
export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const isAdmin = user.role === 'ADMIN'
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' })
  const [pw, setPw] = useState({ password: '', confirm: '' })
  const [ps, setPs] = useState<Status>(idle)
  const [ks, setKs] = useState<Status>(idle)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setP = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) => setPw((f) => ({ ...f, [k]: e.target.value }))

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setPs({ ...idle, busy: true })
    try {
      const { user: u } = await api<{ user: ProfileUser }>('/api/auth/me', { method: 'PATCH', json: form })
      setForm({ name: u.name, email: u.email, phone: u.phone ?? '' })
      setPs({ ...idle, ok: 'Profil berhasil disimpan.' })
      router.refresh()
    } catch (err) {
      setPs({ ...idle, error: (err as Error).message })
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setKs({ ...idle, busy: true })
    try {
      await api('/api/auth/password', { method: 'POST', json: pw })
      setPw({ password: '', confirm: '' })
      setKs({ ...idle, ok: 'Kata sandi berhasil diganti. Perangkat lain telah dikeluarkan.' })
    } catch (err) {
      setKs({ ...idle, error: (err as Error).message })
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card flex flex-col gap-4" noValidate aria-labelledby="h-data">
        <h2 id="h-data" className="text-[17px] font-semibold">Data akun</h2>
        <div><label className="lbl" htmlFor="p-name">Nama lengkap</label><input id="p-name" className="in" value={form.name} onChange={set('name')} autoComplete="name" required /></div>
        <div><label className="lbl" htmlFor="p-email">Email</label><input id="p-email" type="email" className="in" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
        <div>
          <label className="lbl" htmlFor="p-phone">Nomor WhatsApp{isAdmin && <span className="font-normal text-mut"> (opsional)</span>}</label>
          <input id="p-phone" className="in" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="081234567890" required={!isAdmin} />
          {!isAdmin && <p className="hint mt-1">Dipakai untuk kabar kasus Anda.</p>}
        </div>
        <Feedback s={ps} />
        <Button type="submit" disabled={ps.busy} className="self-start">{ps.busy ? 'Menyimpan…' : 'Simpan perubahan'}</Button>
      </form>

      <form onSubmit={savePassword} className="card flex flex-col gap-4" noValidate aria-labelledby="h-pass">
        <h2 id="h-pass" className="text-[17px] font-semibold">Ganti kata sandi</h2>
        <div>
          <label className="lbl" htmlFor="p-new">Kata sandi baru</label>
          <input id="p-new" type="password" className="in" value={pw.password} onChange={setP('password')} autoComplete="new-password" minLength={8} required />
          <p className="hint mt-1">Minimal 8 karakter.</p>
        </div>
        <div><label className="lbl" htmlFor="p-confirm">Ulangi kata sandi baru</label><input id="p-confirm" type="password" className="in" value={pw.confirm} onChange={setP('confirm')} autoComplete="new-password" required /></div>
        <Feedback s={ks} />
        <Button type="submit" variant="secondary" disabled={ks.busy} className="self-start">{ks.busy ? 'Menyimpan…' : 'Ganti kata sandi'}</Button>
      </form>
    </div>
  )
}
