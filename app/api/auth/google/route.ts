import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ticketflix-backend-cpyl.onrender.com/api'

export async function POST(req: NextRequest) {
  try {
    const { google_token } = await req.json()
    const res = await fetch(`${DJANGO}/users/google-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: google_token }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    // Block unapproved venue owners — don't issue any cookies
    if (data.user?.role === 'VENUE_OWNER' && !data.user?.is_approved) {
      return NextResponse.json(
        { error: 'pending_approval' },
        { status: 403 }
      )
    }

    const safeUser = {
      id: data.user.id,
      first_name: data.user.first_name,
      role: data.user.role,
      is_approved: data.user.is_approved,
    }

    const response = NextResponse.json({ user: safeUser })
    response.cookies.set('authToken', data.token, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60, path: '/',
    })
    response.cookies.set('refreshToken', data.refresh, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    response.cookies.set('user', JSON.stringify(safeUser), {
      httpOnly: false, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    return response
  } catch (err) {
    console.error('[auth/google] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Cannot connect to server. Please try again later.' },
      { status: 503 }
    )
  }
}