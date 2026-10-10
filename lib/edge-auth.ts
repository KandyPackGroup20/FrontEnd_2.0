import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Session = { user_id: number; role: string; force_password_reset: boolean };
const backend = (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const staffRoles = ['SUPERADMIN', 'LOGISTICS_MGR', 'DISPATCHER', 'STORE_MGR', 'WAREHOUSE_STAFF', 'DRIVER', 'ASSISTANT'];
const home = (role: string) => ({ SUPERADMIN: '/admin/users', LOGISTICS_MGR: '/admin/rail', DISPATCHER: '/admin/roster', STORE_MGR: '/warehouse', WAREHOUSE_STAFF: '/warehouse', DRIVER: '/profile', ASSISTANT: '/profile' }[role] || '/orders');
const within = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

function forbidden(message: string) {
  return new NextResponse(`<!doctype html><html lang="en"><title>Forbidden</title><body><main><h1>403 Forbidden</h1><p>${message}</p></main></body></html>`, { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminHost = request.nextUrl.hostname.toLowerCase().startsWith('admin.');
  const adminPath = within(pathname, '/admin');
  const authPage = pathname === '/login' || pathname === '/register';
  const protectedPage = adminHost || adminPath || ['/orders', '/order', '/profile', '/warehouse'].some(p => within(pathname, p));
  if (adminHost && pathname === '/register') return forbidden('Registration is available on the customer website only.');
  let session: Session | null = null;
  const token = request.cookies.get('kandypack_session')?.value;
  if (token && (protectedPage || authPage)) {
    try {
      // The backend verifies signature, expiry, active status and the current role.
      const result = await fetch(`${backend}/api/v1/auth/me`, {
        headers: { cookie: `kandypack_session=${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
      });
      if (result.ok) session = await result.json() as Session;
      else if (result.status !== 401 && result.status !== 403) throw new Error('Session service unavailable');
    } catch {
      return new NextResponse('Session verification is temporarily unavailable. Please retry.', { status: 503 });
    }
  }
  if (protectedPage && !session && pathname !== '/login') {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  if (session && (adminHost || adminPath) && !staffRoles.includes(session.role)) return forbidden('Customer accounts cannot access the administrative portal.');
  if (session?.force_password_reset && pathname !== '/profile') return NextResponse.redirect(new URL('/profile?force_reset=true', request.url));
  const gates: [string, string[]][] = [
    ['/admin/users', ['SUPERADMIN']],
    ['/admin/rail', ['SUPERADMIN', 'LOGISTICS_MGR']],
    ['/admin/roster', ['SUPERADMIN', 'LOGISTICS_MGR', 'DISPATCHER']],
    ['/admin/reports', ['SUPERADMIN']],
    ['/warehouse', ['SUPERADMIN', 'LOGISTICS_MGR', 'STORE_MGR', 'WAREHOUSE_STAFF']],
  ];
  if (session && gates.some(([path, roles]) => within(pathname, path) && !roles.includes(session.role))) return forbidden('Your role cannot access this page.');
  if (session && staffRoles.includes(session.role) && within(pathname, '/order')) return NextResponse.redirect(new URL(home(session.role), request.url));
  if (session && authPage) return NextResponse.redirect(new URL(home(session.role), request.url));
  return NextResponse.next();
}
