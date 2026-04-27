import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params

  // ✅ ALWAYS build path safely
  let pathStr = path.join('/')

  // 🔥 CRITICAL FIX: always ensure trailing slash (for Django)
  if (!pathStr.endsWith('/')) {
    pathStr += '/'
  }

  const token = req.cookies.get('authToken')?.value
  const search = req.nextUrl.search || ''

  // ✅ final backend URL
  const url = `${DJANGO}/${pathStr}${search}`

  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const contentType = req.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')

  // 🔥 VERY IMPORTANT: forward content-type (keeps multipart boundary intact)
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  let body: BodyInit | undefined

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (isMultipart) {
      // 🔥 stream directly (prevents corruption)
      body = req.body ?? undefined
    } else {
      const ab = await req.arrayBuffer()
      body = Buffer.from(ab)
    }
  }

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },

      // 🔥 CRITICAL: prevent redirect breaking POST
      redirect: 'manual',

      // @ts-ignore
      duplex: 'half',
    })

    const responseData = await res.arrayBuffer()

    return new NextResponse(responseData, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
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