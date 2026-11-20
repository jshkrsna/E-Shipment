import { route, readJson } from '@/server/http'
import { requireAdmin } from '@/server/services/auth'
import { addNote } from '@/server/services/admin'

export const POST = route<{ code: string }>(async (req, { code }) => addNote(code, await requireAdmin(), await readJson(req)))
