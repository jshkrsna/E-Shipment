import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { saveValidation } from '@/server/services/admin'

export const PUT = route<{ code: string }>(async (req, { code }) => saveValidation(code, await requireAdmin(), await readJson(req)))
