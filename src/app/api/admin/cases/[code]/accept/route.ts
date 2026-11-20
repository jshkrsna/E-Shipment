import { route } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { acceptCase } from '@/server/services/admin'

export const POST = route<{ code: string }>(async (_req, { code }) => acceptCase(code, await requireAdmin()))
