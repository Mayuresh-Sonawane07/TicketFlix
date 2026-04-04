import { NextRequest, NextResponse } from 'next/server'

const DJANGO =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-cf420.up.railway.app/api'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const token = req.cookies.get('authToken')?.value

  // ✅ Always append trailing slash — Django requires it
  const pathStr = path.join('/')
  const url = `${DJANGO}/${pathStr}/${req.nextUrl.search}`
  //                                 ↑ added

  const contentType = req.headers.get('Content-Type') || 'application/json'
  const headers: Record<string, string> = { 'Content-Type': contentType }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined

  try {
    const res = await fetch(url, { method: req.method, headers, body })
    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (err) {
    console.error(`[proxy] Failed to reach backend at ${url}:`, err)
    return NextResponse.json(
      { error: 'Backend unreachable', detail: String(err) },
      { status: 503 }
    )
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }