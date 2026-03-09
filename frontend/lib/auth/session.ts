import { cookies } from 'next/headers';

export type Session = {
  isAuthenticated: boolean;
  role?: 'pending' | 'customer' | 'shop' | 'admin' | 'dispatcher';
  userId?: string;
  email?: string;
};

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const role = cookieStore.get('role')?.value as Session['role'];
  const payload = decodeJwtPayload(accessToken);
  const emailFromToken = typeof payload?.email === 'string' && payload.email.trim() ? payload.email.trim() : undefined;
  const emailFromCookie = cookieStore.get('user_email')?.value;

  return {
    isAuthenticated: Boolean(accessToken || refreshToken),
    role,
    userId: cookieStore.get('user_id')?.value,
    email: emailFromToken ?? emailFromCookie
  };
}
