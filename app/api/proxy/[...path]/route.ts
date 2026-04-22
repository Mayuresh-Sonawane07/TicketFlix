import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ticketflix-backend-cpyl.onrender.com/api'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = path.join('/')
  const token = req.cookies.get('authToken')?.value
  const search = req.nextUrl.search || ''
  const url = `${DJANGO}/${pathStr}/${search}`

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const contentType = req.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')

  // For multipart: forward the content-type WITH boundary intact
  // For everything else: forward as-is
  if (contentType) {
    headers['Content-Type'] = contentType  // ← always forward, including multipart+boundary
  }

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (isMultipart) {
      // Stream the body directly — buffering can corrupt multipart boundaries
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
      cache: 'no-store',          // 🔥 VERY IMPORTANT
      next: { revalidate: 0 },    // 🔥 disable Next.js caching
      // @ts-ignore
      duplex: 'half',
    })

    const responseData = await res.arrayBuffer()
    return new NextResponse(responseData, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',   // 🔥 prevents browser caching
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

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS }