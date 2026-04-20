import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathStr = params.path.join('/')
  const token = req.cookies.get('authToken')?.value
  const search = req.nextUrl.search || ''
  const url = `${DJANGO}/${pathStr}/${search}`

  console.log(`[proxy] ${req.method} ${url} | auth: ${!!token}`)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const contentType = req.headers.get('Content-Type') || ''
  if (contentType && !contentType.includes('multipart/form-data')) {
    headers['Content-Type'] = contentType
  }

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    })

    const responseBody = await res.arrayBuffer()

    return new NextResponse(responseBody, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    console.error('[proxy] error:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', detail: String(err) },
      { status: 503 }
    )
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
}