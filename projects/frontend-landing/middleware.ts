import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${routing.defaultLocale}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/(en|ko)/:path*'],
}
