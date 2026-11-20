import { route } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { deleteEvidence } from '@/server/services/evidence'

export const DELETE = route<{ id: string }>(async (_req, { id }) => deleteEvidence(await requirePengguna(), Number(id)))
