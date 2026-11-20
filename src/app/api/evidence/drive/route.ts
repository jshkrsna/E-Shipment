import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { importFromDrive } from '@/server/services/evidence'

export const maxDuration = 60
export const POST = route(async (req) => ({ evidence: await importFromDrive(await requirePengguna(), await readJson(req)) }))
