import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { closeCase } from '@/server/services/admin'

export const POST = route<{ code: string }>(async (req, { code }) => closeCase(code, await requireAdmin(), await readJson(req)))
