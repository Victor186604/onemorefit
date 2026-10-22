/**
 * Middleware — roda no Edge Runtime.
 * Importa SOMENTE authConfig (sem banco, sem pglite, sem pg).
 */
import NextAuth from 'next-auth'
import { authConfig } from '@/server/auth/config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl

  // Cron protegido por secret (não pelo Auth.js)
  if (pathname.startsWith('/api/cron')) {
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)'],
}
