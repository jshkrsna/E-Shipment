import { readJson, route } from '@/server/http'
import { getCurrentUser, requireUser, updateProfile } from '@/server/services/auth'

export const GET = route(async () => ({ user: await getCurrentUser() }))

/** Ubah profil akun sendiri (nama, email, nomor). */
export const PATCH = route(async (req) => ({ user: await updateProfile(await requireUser(), await readJson(req)) }))
