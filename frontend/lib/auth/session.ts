import { cookies } from 'next/headers';

export type Session = {
  isAuthenticated: boolean;
  role?: 'customer' | 'shop' | 'admin' | 'dispatcher';
  userId?: string;
};

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value || cookieStore.get('sessionid')?.value;
  const role = cookieStore.get('role')?.value as Session['role'];

  return {
    isAuthenticated: Boolean(token),
    role,
    userId: cookieStore.get('user_id')?.value
  };
}
