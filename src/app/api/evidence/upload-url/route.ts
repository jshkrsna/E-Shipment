import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { requestUpload } from '@/server/services/evidence'

export const POST = route(async (req) => requestUpload(await requirePengguna(), await readJson(req)))
