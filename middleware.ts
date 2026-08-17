import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/anomalies',
  '/rules',
  '/enumerators',
  '/ingest',
  '/export'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('survintel_session')?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // 1. Redirect unauthenticated users away from protected routes to /login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect root path / to /dashboard if authenticated, else /login
  if (pathname === '/') {
    const targetUrl = new URL(isAuthenticated ? '/dashboard' : '/login', request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Redirect authenticated users away from auth pages to /dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|status).*)']
};
