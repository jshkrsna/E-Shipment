import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { registerUpload } from '@/server/services/evidence'

export const POST = route(async (req) => ({ evidence: await registerUpload(await requirePengguna(), await readJson(req)) }))
