import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { recordScan } from '@/server/services/admin'

export const POST = route(async (req) => recordScan(await requireAdmin(), await readJson(req)))
