import { NextRequest, NextResponse } from 'next/server'

const PROTECTED  = ['/bookings', '/checkout', '/seat-selection', '/venue-dashboard', '/admin-panel', '/wishlist']
const AUTH_ONLY  = ['/login', '/register']
const VENUE_ONLY = ['/venue-dashboard']

export function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  const user  = req.cookies.get('user')?.value
  const path  = req.nextUrl.pathname

  const isProtected = PROTECTED.some(p => path.startsWith(p))
  const isAuthOnly  = AUTH_ONLY.some(p => path.startsWith(p))
  const isVenuePath = VENUE_ONLY.some(p => path.startsWith(p))

  // Not logged in → redirect to login for protected routes
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Already logged in → redirect away from login/register
  if (isAuthOnly && token) {
    try {
      const parsed = JSON.parse(user || '{}')
      if (parsed.role === 'Admin') return NextResponse.redirect(new URL('/admin-panel', req.url))
      if (parsed.role === 'VENUE_OWNER') {
        // Unapproved venue owners go back to pending page even from login/register
        if (!parsed.is_approved) return NextResponse.redirect(new URL('/pending-approval', req.url))
        return NextResponse.redirect(new URL('/venue-dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    } catch {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Venue dashboard — must be an APPROVED venue owner
  if (isVenuePath && token) {
    try {
      const parsed = JSON.parse(user || '{}')
      if (parsed.role !== 'VENUE_OWNER') {
        // Customers / admins shouldn't access venue dashboard
        return NextResponse.redirect(new URL('/', req.url))
      }
      if (!parsed.is_approved) {
        // Venue owner exists but not yet approved
        return NextResponse.redirect(new URL('/pending-approval', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}