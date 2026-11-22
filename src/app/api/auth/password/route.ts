import { readJson, route } from '@/server/http'
import { changePassword, requireUser } from '@/server/services/auth'

/** Ganti kata sandi akun sendiri (kata sandi baru + konfirmasi). */
export const POST = route(async (req) => changePassword(await requireUser(), await readJson(req)))
