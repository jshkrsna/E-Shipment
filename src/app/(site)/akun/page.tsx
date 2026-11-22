import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile-form'
import { getCurrentUser } from '@/server/services/auth'

export const metadata = { title: 'Profil saya' }

export default async function AkunPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/akun')
  if (user.role === 'ADMIN') redirect('/admin/akun')
  return (
    <div className="wx flex max-w-[960px] flex-col gap-6 py-8 lg:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-extrabold md:text-[28px]">Profil saya</h1>
        <p className="text-mut">Ubah data akun dan kata sandi Anda.</p>
      </div>
      <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, role: user.role }} />
    </div>
  )
}
