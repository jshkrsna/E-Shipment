import { route } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { escalateCase } from '@/server/services/cases'

export const POST = route<{ code: string }>(async (_req, { code }) => escalateCase(code, await requirePengguna()))
