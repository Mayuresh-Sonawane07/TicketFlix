import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

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

    const response = NextResponse.json({ user: data.user })
    response.cookies.set('authToken', data.token, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60,
    })
    response.cookies.set('refreshToken', data.refresh, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7,
    })
    response.cookies.set('user', JSON.stringify(data.user), {
      httpOnly: false, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (err) {
    console.error('[auth/login] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Cannot connect to server. Please try again later.' },
      { status: 503 }
    )
  }
}