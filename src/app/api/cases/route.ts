import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { createCase, listMyCases } from '@/server/services/cases'

export const GET = route(async () => ({ cases: await listMyCases(await requirePengguna()) }))
export const POST = route(async (req) => {
  const c = await createCase(await requirePengguna(), await readJson(req))
  return { code: c.code }
})
