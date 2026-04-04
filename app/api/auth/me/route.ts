import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const user = req.cookies.get('user')?.value
  if (!user) return NextResponse.json(null, { status: 401 })
  try {
    return NextResponse.json(JSON.parse(user))
  } catch {
    return NextResponse.json(null, { status: 401 })
  }
}