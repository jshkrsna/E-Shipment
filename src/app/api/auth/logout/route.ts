import { route } from '@/server/http'
import { logout } from '@/server/services/auth'

export const POST = route(async () => {
  await logout()
  return { ok: true }
})
