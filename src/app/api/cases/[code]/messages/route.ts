import { route, readJson } from '@/server/http'
import { requireUser } from '@/server/services/auth'
import { listMessages, postMessage } from '@/server/services/cases'

export const GET = route<{ code: string }>(async (req, { code }) => {
  const after = Number(new URL(req.url).searchParams.get('after') || 0)
  return listMessages(code, await requireUser(), after)
})
export const POST = route<{ code: string }>(async (req, { code }) => ({ message: await postMessage(code, await requireUser(), await readJson(req)) }))
