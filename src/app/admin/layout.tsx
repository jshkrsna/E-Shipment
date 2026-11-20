import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin-shell'
import { getCurrentUser } from '@/server/services/auth'
import { listCases } from '@/server/services/admin'

export const metadata = { title: { default: 'Panel admin', template: '%s · Admin E-Shipmennt' } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk?next=/admin')
  if (user.role !== 'ADMIN') redirect('/')
  const { counts } = await listCases()
  return <AdminShell name={user.name} baru={counts.baru}>{children}</AdminShell>
}
