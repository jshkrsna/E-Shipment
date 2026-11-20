import { route } from '@/server/http'
import { getCurrentUser } from '@/server/services/auth'

export const GET = route(async () => ({ user: await getCurrentUser() }))
