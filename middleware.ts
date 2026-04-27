import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/bookings', '/checkout', '/seat-selection', '/venue-dashboard', '/admin-panel', '/wishlist']
const AUTH_ONLY = ['/login', '/register']

export function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  const user  = req.cookies.get('user')?.value
  const path  = req.nextUrl.pathname

  const isProtected = PROTECTED.some(p => path.startsWith(p))
  const isAuthOnly  = AUTH_ONLY.some(p => path.startsWith(p))

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuthOnly && token) {
    try {
      const parsed = JSON.parse(user || '{}')
      if (parsed.role === 'Admin') return NextResponse.redirect(new URL('/admin-panel', req.url))
      if (parsed.role === 'VENUE_OWNER') return NextResponse.redirect(new URL('/venue-dashboard', req.url))
      return NextResponse.redirect(new URL('/', req.url))
    } catch {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}