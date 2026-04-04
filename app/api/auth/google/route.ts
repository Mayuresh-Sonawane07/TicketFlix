import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

export async function POST(req: NextRequest) {
  const { google_token } = await req.json()
  const res = await fetch(`${DJANGO}/users/google-login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: google_token }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })

  const response = NextResponse.json({ user: data.user })
  response.cookies.set('authToken', data.token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 })
  response.cookies.set('refreshToken', data.refresh, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
  response.cookies.set('user', JSON.stringify(data.user), { httpOnly: false, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
  return response
}