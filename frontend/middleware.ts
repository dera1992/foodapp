import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const protectedPrefixes = ['/cart', '/wishlist', '/budget-planner', '/account', '/messages', '/admin', '/dispatcher'];

// These paths are allowed unconditionally — checked before any cookie/role logic
const publicPaths = [
  '/account/choose-role',      // Pending users MUST reach this page — never redirect it
  '/account/activate/',
  '/account/password-reset',
  '/account/password-reset-confirm/',
  '/login',
  '/register',
];

/** Decode a JWT payload and check whether it has expired (with a 30 s buffer). */
function isAccessTokenExpired(token: string): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) return true;
    const payload = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
    if (!payload.exp) return true;
    // Treat as expired 30 s early so the page always gets a fresh token
    return Date.now() / 1000 >= payload.exp - 30;
  } catch {
    return true;
  }
}

/** Exchange a refresh token for a new access token via the Django backend. */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.access as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Short-circuit for all public paths before any other checks
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let accessToken = request.cookies.get('access_token')?.value;
  const sessionToken = request.cookies.get('sessionid')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const role = request.cookies.get('role')?.value;

  // Proactively refresh the access token before it causes a 401 on any server fetch.
  // We only attempt this when we have a refresh token and the access token is absent or expired.
  let newAccessToken: string | null = null;
  if (refreshToken && (!accessToken || isAccessTokenExpired(accessToken))) {
    newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      accessToken = newAccessToken;
    }
  }

  // The "effective" token for auth checks (access or session cookie)
  const token = accessToken || sessionToken;

  /** Helper: attach the refreshed cookie to any response we return. */
  function withRefreshedCookie(res: NextResponse): NextResponse {
    if (newAccessToken) {
      res.cookies.set('access_token', newAccessToken, {
        httpOnly: false,   // must stay readable by JS (client.ts reads document.cookie)
        maxAge: 86400,     // 24 h — matches the existing cookie lifetime
        path: '/',
        sameSite: 'lax',
      });
    }
    return res;
  }

  // Authenticated users with a pending role cannot access any other page
  if (token && role === 'pending') {
    const url = request.nextUrl.clone();
    url.pathname = '/account/choose-role';
    return withRefreshedCookie(NextResponse.redirect(url));
  }

  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!requiresAuth) {
    return withRefreshedCookie(NextResponse.next());
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
      return withRefreshedCookie(NextResponse.redirect(url));
    }
  }

  // /dispatcher portal — only dispatcher role (and site admins) may enter
  if (pathname.startsWith('/dispatcher')) {
    if (role !== 'dispatcher' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return withRefreshedCookie(NextResponse.redirect(url));
    }
  }

  return withRefreshedCookie(NextResponse.next());
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
