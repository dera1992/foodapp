import { NextResponse } from 'next/server';

const AUTH_COOKIES = ['access_token', 'refresh_token', 'role', 'user_id', 'sessionid'];

/**
 * POST /api/auth/logout
 *
 * Clears all auth cookies via Set-Cookie response headers.
 * This is the only way to delete HttpOnly cookies (e.g. Django's sessionid)
 * because JavaScript's document.cookie cannot touch them.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  return response;
}
