import { route } from '@/server/http'
import { requireUser } from '@/server/services/auth'
import { getCaseForViewer } from '@/server/services/cases'

export const GET = route<{ code: string }>(async (_req, { code }) => getCaseForViewer(code, await requireUser()))
