import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { setTraceStatus } from '@/server/services/admin'

export const PUT = route<{ code: string; locId: string }>(async (req, { code, locId }) =>
  setTraceStatus(code, Number(locId), await requireAdmin(), await readJson(req)),
)
