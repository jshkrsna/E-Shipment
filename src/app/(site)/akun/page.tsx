import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'
import { getCurrentUser } from '@/server/services/auth'
import { Reveal } from '@/components/reveal'

export const metadata = { title: 'Profil saya' }

export default async function AkunPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/akun')
  if (user.role === 'ADMIN') redirect('/admin/akun')
  return (
    <Reveal>
      <div className="wx flex max-w-[960px] flex-col gap-6 py-10 lg:py-16">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-navy-d md:text-[32px]">Profil saya</h1>
          <p className="text-mut">Ubah data akun dan kata sandi Anda.</p>
        </div>
        <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, role: user.role }} />
      </div>
    </Reveal>
  )
}
