import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { getCurrentUser } from '@/server/services/auth'

export const metadata = { title: 'Masuk' }

export default async function MasukPage() {
  const user = await getCurrentUser()
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/kasus')
  return (
    <div className="wx flex max-w-[440px] flex-col gap-5 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-extrabold">Masuk</h1>
        <p className="text-mut">Masuk untuk menyimpan bukti unboxing, melapor, dan memantau kasus.</p>
      </div>
      <Suspense><AuthForm mode="masuk" /></Suspense>
    </div>
  )
}
