import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/cart', '/wishlist', '/budget-planner', '/account', '/messages', '/admin'];
const publicAccountPaths = ['/account/password-reset', '/account/password-reset/'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (publicAccountPaths.includes(pathname)) {
    return NextResponse.next();
  }
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value || request.cookies.get('sessionid')?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cart/:path*', '/wishlist/:path*', '/budget-planner/:path*', '/account/:path*', '/messages/:path*', '/admin/:path*']
};
