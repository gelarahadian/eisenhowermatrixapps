import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/landing', '/auth/signin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLoggedIn =
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token')

  const isPublicPage =
    pathname === '/' ||
    PUBLIC_PATHS.some(path => path !== '/' && pathname.startsWith(path))

  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
}
