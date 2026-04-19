import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ticketflix-backend-cpy1.onrender.com/api'

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathStr = params.path.join('/')
  const token = req.cookies.get('authToken')?.value

  const url = `${DJANGO}/${pathStr}/${req.nextUrl.search || ''}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : undefined

  try {
    const res = await fetch(url, { method: req.method, headers, body })
    const data = await res.text()

    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Backend unreachable', detail: String(err) },
      { status: 503 }
    )
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }