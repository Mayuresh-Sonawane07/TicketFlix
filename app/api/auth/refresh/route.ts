import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ticketflix-backend-cpy1.onrender.com'

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get('refreshToken')?.value
  if (!refresh) return NextResponse.json({ error: 'No refresh token' }, { status: 401 })

  const res = await fetch(`${DJANGO}/users/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  const data = await res.json()
  if (!res.ok) {
    const response = NextResponse.json({ error: 'Token expired' }, { status: 401 })
    response.cookies.delete('authToken')
    response.cookies.delete('refreshToken')
    response.cookies.delete('user')
    return response
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('authToken', data.access, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60,
  })
  if (data.refresh) {
    response.cookies.set('refreshToken', data.refresh, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7,
    })
  }
  return response
}