import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/cart', '/wishlist', '/budget-planner', '/account', '/messages', '/admin'];

// These paths are allowed unconditionally — checked before any cookie/role logic
const publicPaths = [
  '/account/choose-role',      // Pending users MUST reach this page — never redirect it
  '/account/activate/',
  '/account/password-reset',
  '/account/password-reset-confirm/',
  '/login',
  '/register',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Short-circuit for all public paths before any other checks
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value || request.cookies.get('sessionid')?.value;
  const role = request.cookies.get('role')?.value;

  // Authenticated users with a pending role cannot access any other page
  if (token && role === 'pending') {
    const url = request.nextUrl.clone();
    url.pathname = '/account/choose-role';
    return NextResponse.redirect(url);
  }

  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // /admin is the shop dashboard — only shop owners (and site admins) may enter
  if (pathname.startsWith('/admin')) {
    if (role !== 'shop' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Run on all routes except Next.js internals and static files so the
   * pending-role guard applies across the whole app.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
