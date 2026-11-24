import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { addLink } from '@/server/services/evidence'

export const POST = route(async (req) => ({ evidence: await addLink(await requirePengguna(), await readJson(req)) }))
