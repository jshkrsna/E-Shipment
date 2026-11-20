import { route, readJson } from '@/server/http'
import { requirePengguna } from '@/server/services/auth'
import { claimShipment } from '@/server/services/shipments'

export const POST = route<{ awb: string }>(async (req, { awb }) => claimShipment(awb, await requirePengguna(), await readJson(req)))
