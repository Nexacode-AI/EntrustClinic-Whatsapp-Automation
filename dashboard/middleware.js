import { NextResponse } from 'next/server'

export function middleware(request) {
  const cookie = request.cookies.get('entrust_session')
  const secret = process.env.SESSION_SECRET || 'entrust_session_secret'
  const isLoggedIn = cookie?.value === secret

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|privacy|terms|$).*)',
  ],
}
