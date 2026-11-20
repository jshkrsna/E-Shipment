import { route, readJson } from '@/server/http'
import { register } from '@/server/services/auth'

export const POST = route(async (req) => ({ user: await register(await readJson(req)) }))
