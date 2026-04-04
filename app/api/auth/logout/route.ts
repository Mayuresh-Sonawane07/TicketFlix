import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get('refreshToken')?.value
  if (refresh) {
    await fetch(`${DJANGO}/users/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    }).catch(() => {})
  }
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('authToken')
  response.cookies.delete('refreshToken')
  response.cookies.delete('user')
  return response
}