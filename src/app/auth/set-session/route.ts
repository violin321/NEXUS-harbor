import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { access_token, refresh_token } = body
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: '缺少 token' }, { status: 400 })
    }

    const response = NextResponse.json({ ok: true })
    const accessTokenCookie = `sb-${projectRef}-access-token`
    const refreshTokenCookie = `sb-${projectRef}-refresh-token`

    response.cookies.set(accessTokenCookie, access_token, {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60,
    })
    response.cookies.set(refreshTokenCookie, refresh_token, {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch {
    return NextResponse.json({ error: '解析失败' }, { status: 400 })
  }
}
