import { NextRequest, NextResponse } from 'next/server'

const DJANGO = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-cf420.up.railway.app/api'

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = req.cookies.get('authToken')?.value
  const path  = params.path.join('/')
  const url   = `${DJANGO}/${path}${req.nextUrl.search}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text() : undefined

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }