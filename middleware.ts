import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
  force_password_reset?: boolean;
  exp?: number;
}

function decodeJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('kandypack_session')?.value;

  // 1. Protected routes that require an authenticated session
  const protectedPrefixes = ['/orders', '/order', '/profile'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  // 2. Auth routes where already-logged-in users should be redirected
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Decode JWT session token if present
  const session = token ? decodeJwtPayload(token) : null;
  const isTokenExpired = session?.exp ? Date.now() >= session.exp * 1000 : false;
  const isAuthenticated = Boolean(session && !isTokenExpired);

  // Case A: Unauthenticated user trying to access protected customer routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case B: Authenticated user trying to access /login or /register
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/orders', request.url));
  }

  // Case C: Enforce forced password reset on initial login
  if (isAuthenticated && session?.force_password_reset && pathname !== '/profile') {
    const profileUrl = new URL('/profile', request.url);
    profileUrl.searchParams.set('force_reset', 'true');
    return NextResponse.redirect(profileUrl);
  }

  // Pass headers with user role for downstream server components
  const response = NextResponse.next();
  if (isAuthenticated && session) {
    response.headers.set('x-user-id', session.sub);
    response.headers.set('x-user-role', session.role);
    response.headers.set('x-user-email', session.email);
  }

  return response;
}

export const config = {
  matcher: [
    '/orders/:path*',
    '/order/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/admin/:path*'
  ],
};
