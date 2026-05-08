import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]

// GET: Handle legacy code-based PKCE flow (fallback)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/admin'

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/admin/login`)
  }

  // This shouldn't happen with the fragment flow, but handle it anyway
  const verifierBytes = req.cookies.get(`sb-${projectRef}-pkce-verifier`)
  if (!verifierBytes) {
    return NextResponse.redirect(`${SITE_URL}/admin/login`)
  }

  // Exchange code for tokens
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    body: JSON.stringify({ auth_code: code, code_verifier: verifierBytes.value }),
  })

  if (!resp.ok) {
    return NextResponse.redirect(`${SITE_URL}/admin/login`)
  }

  const tokens = await resp.json()
  const response = NextResponse.redirect(`${SITE_URL}${next}`)

  setSessionCookies(response, tokens.access_token, tokens.refresh_token, projectRef)
  return response
}

// POST: Handle fragment-based flow (Supabase standard)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { access_token, refresh_token } = body

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: '缺少 token' }, { status: 400 })
    }

    const response = NextResponse.json({ ok: true })
    setSessionCookies(response, access_token, refresh_token, projectRef)
    return response
  } catch {
    return NextResponse.json({ error: '解析失败' }, { status: 400 })
  }
}

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken: string, ref: string) {
  const accessTokenCookie = `sb-${ref}-access-token`
  const refreshTokenCookie = `sb-${ref}-refresh-token`

  response.cookies.set(accessTokenCookie, accessToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hour
  })

  response.cookies.set(refreshTokenCookie, refreshToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}
