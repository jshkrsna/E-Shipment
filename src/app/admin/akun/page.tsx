import { ProfileForm } from '@/components/profile-form'
import { requireAdmin } from '@/server/services/auth'

export const metadata = { title: 'Profil saya' }

export default async function AdminAkunPage() {
  // Layout admin sudah mengalihkan tamu dan Pengguna; ini pengaman tambahan.
  const user = await requireAdmin()
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-extrabold md:text-[24px]">Profil saya</h1>
        <span className="text-mut">Ubah data akun dan kata sandi admin.</span>
      </div>
      <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone, role: user.role }} />
    </div>
  )
}
