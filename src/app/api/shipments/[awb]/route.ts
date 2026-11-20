import { notFound, route } from '@/server/http'
import { getCurrentUser } from '@/server/services/auth'
import { getTracking } from '@/server/services/shipments'

export const GET = route<{ awb: string }>(async (_req, { awb }) => {
  const data = await getTracking(awb, await getCurrentUser())
  if (!data) throw notFound('Nomor resi tidak ditemukan.')
  return data
})
