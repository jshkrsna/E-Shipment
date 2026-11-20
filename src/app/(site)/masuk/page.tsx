import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { Banner } from '@/components/ui'
import { getCurrentUser } from '@/server/services/auth'

export const metadata = { title: 'Masuk' }

export default async function MasukPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/kasus')
  const demo = !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin12345'
  return (
    <div className="wx flex max-w-[440px] flex-col gap-5 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-extrabold">Masuk</h1>
        <p className="text-mut">Masuk untuk menyimpan bukti unboxing, melapor, dan memantau kasus.</p>
      </div>
      <Suspense><AuthForm mode="masuk" /></Suspense>
      {demo && (
        <Banner tone="nb" icon="info">
          <div className="flex flex-col gap-1 text-[13px]">
            <b>Akun demo (data contoh)</b>
            <span>Pengguna: <code className="font-mono">pengguna@eshipmennt.test</code> / <code className="font-mono">pengguna12345</code></span>
            <span>Admin: <code className="font-mono">admin@eshipmennt.test</code> / <code className="font-mono">admin12345</code></span>
          </div>
        </Banner>
      )}
    </div>
  )
}
