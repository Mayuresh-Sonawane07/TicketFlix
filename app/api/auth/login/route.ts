import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${DJANGO}/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    // Only store non-sensitive fields in the readable cookie
    const safeUser = {
      id: data.user.id,
      first_name: data.user.first_name,
      role: data.user.role,         // 'Customer' | 'Admin' | 'VENUE_OWNER'
      is_approved: data.user.is_approved,
    }

    const response = NextResponse.json({ user: safeUser })

    response.cookies.set('authToken', data.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    })
    response.cookies.set('refreshToken', data.refresh, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    // Readable by JS for role-based routing — no sensitive data
    response.cookies.set('user', JSON.stringify(safeUser), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[auth/login] error:', err)
    return NextResponse.json(
      { error: 'Cannot connect to server. Please try again later.' },
      { status: 503 }
    )
  }
}