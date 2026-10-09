export { middleware } from './lib/edge-auth';
export const config = { matcher: ['/((?!api/|_next/|favicon.ico|.*\\.[^/]+$).*)'] };
