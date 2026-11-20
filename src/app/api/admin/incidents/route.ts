import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { publishIncident } from '@/server/services/admin'

export const POST = route(async (req) => ({ incident: await publishIncident(await requireAdmin(), await readJson(req)) }))
