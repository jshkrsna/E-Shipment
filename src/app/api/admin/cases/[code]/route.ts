import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { getAdminCase, updateCase } from '@/server/services/admin'

export const GET = route<{ code: string }>(async (_req, { code }) => {
  await requireAdmin()
  return getAdminCase(code)
})
export const PATCH = route<{ code: string }>(async (req, { code }) => updateCase(code, await requireAdmin(), await readJson(req)))
