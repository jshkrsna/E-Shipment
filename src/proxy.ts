import { NextResponse, type NextRequest } from 'next/server'

/** Pemeriksaan optimistis: arahkan ke halaman masuk bila belum ada cookie sesi. Otorisasi penuh tetap di server. */
export function proxy(req: NextRequest) {
  if (!req.cookies.get('es_session')) {
    const url = new URL('/masuk', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/kasus/:path*', '/lapor/:path*'] }
