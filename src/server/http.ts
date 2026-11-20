import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const badRequest = (m: string) => new HttpError(400, m)
export const unauthorized = (m = 'Silakan masuk terlebih dahulu.') => new HttpError(401, m)
export const forbidden = (m = 'Anda tidak memiliki akses.') => new HttpError(403, m)
export const notFound = (m = 'Data tidak ditemukan.') => new HttpError(404, m)
export const conflict = (m: string) => new HttpError(409, m)

type Ctx<P> = { params: Promise<P> }

/** Bungkus route handler: tangani error, cek Origin untuk mutasi (CSRF). */
export function route<P = Record<string, string>>(
  fn: (req: NextRequest, params: P) => Promise<Response | unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertSameOrigin(req)
      const params = ctx?.params ? await ctx.params : ({} as P)
      const out = await fn(req, params)
      if (out instanceof Response) return out
      return NextResponse.json(out ?? { ok: true })
    } catch (err) {
      return errorResponse(err)
    }
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
  if (err instanceof ZodError) {
    const first = err.issues[0]
    return NextResponse.json({ error: first?.message || 'Data tidak valid.', issues: err.issues }, { status: 422 })
  }
  console.error(err)
  return NextResponse.json({ error: 'Terjadi kesalahan di server.' }, { status: 500 })
}

function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin) return // permintaan non-browser (skrip/CLI) tidak membawa Origin
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  try {
    if (new URL(origin).host !== host) throw forbidden('Permintaan lintas situs ditolak.')
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw forbidden('Origin tidak valid.')
  }
}

export async function readJson<T = unknown>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw badRequest('Body JSON tidak valid.')
  }
}
