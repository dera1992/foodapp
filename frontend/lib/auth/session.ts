import { cookies } from 'next/headers';

export type Session = {
  isAuthenticated: boolean;
  role?: 'pending' | 'customer' | 'shop' | 'admin' | 'dispatcher';
  userId?: string;
};

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const role = cookieStore.get('role')?.value as Session['role'];

  return {
    isAuthenticated: Boolean(accessToken || refreshToken),
    role,
    userId: cookieStore.get('user_id')?.value
  };
}
