import { route } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { listCases } from '@/server/services/admin'

export const GET = route(async (req) => {
  await requireAdmin()
  const f = (new URL(req.url).searchParams.get('status') || 'semua') as 'semua'
  return listCases(f)
})
