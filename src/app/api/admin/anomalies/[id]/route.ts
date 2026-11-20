import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { assignAnomaly } from '@/server/services/admin'

export const PATCH = route<{ id: string }>(async (req, { id }) => assignAnomaly(Number(id), await requireAdmin(), await readJson(req)))
