import { route } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { createShareLink, revokeShareLink } from '@/server/services/cases'

export const POST = route<{ code: string }>(async (_req, { code }) => {
  const link = await createShareLink(code, await requirePengguna())
  return { token: link.token, expiresAt: link.expiresAt }
})
export const DELETE = route<{ code: string }>(async (_req, { code }) => revokeShareLink(code, await requirePengguna()))
