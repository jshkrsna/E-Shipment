import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { scheduleRedelivery } from '@/server/services/admin'

export const POST = route<{ code: string }>(async (req, { code }) => scheduleRedelivery(code, await requireAdmin(), await readJson(req)))
