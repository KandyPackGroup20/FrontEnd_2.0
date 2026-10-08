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
  const protectedPrefixes = ['/orders', '/order', '/profile', '/admin'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  // 2. Auth routes where already-logged-in users should be redirected
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Decode JWT session token if present
  const session = token ? decodeJwtPayload(token) : null;
  const isTokenExpired = session?.exp ? Date.now() >= session.exp * 1000 : false;
  const isAuthenticated = Boolean(session && !isTokenExpired);

  // Case A: Unauthenticated user trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case B: Rail Management RBAC (strict 403 for dispatchers, warehouse staff, and customers)
  if (pathname.startsWith('/admin/rail')) {
    const railRoles = ['LOGISTICS_MGR', 'SUPERADMIN'];
    if (!session || !railRoles.includes(session.role)) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>403 Forbidden - Access Denied</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #0b1320; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
    .card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 1.25rem; padding: 2.5rem; max-width: 480px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(12px); }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    h1 { color: #ffffff; font-size: 1.75rem; font-weight: 800; margin: 0 0 0.75rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.5rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; background: #16a34a; color: #ffffff; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-size: 0.875rem; transition: background 0.2s; }
    .btn:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">403 Forbidden</div>
    <h1>Access Denied</h1>
    <p>You do not have permission to view or manage train capacity allocations. Only <strong>Logistics Managers</strong> and <strong>Superadmins</strong> are authorized.</p>
    <a href="/orders" class="btn">&larr; Return to Orders</a>
  </div>
</body>
</html>`,
        {
          status: 403,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        }
      );
    }
  }

  // Case C: Authenticated user trying to access /login or /register
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
