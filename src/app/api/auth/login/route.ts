import { route, readJson } from '@/server/http'
import { login } from '@/server/services/auth'

export const POST = route(async (req) => ({ user: await login(await readJson(req)) }))
