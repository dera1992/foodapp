import { redirect } from 'next/navigation';
import type { Session } from './session';

export function requireAuth(session: Session) {
  if (!session.isAuthenticated) {
    redirect('/login');
  }
}

export function requireAdmin(session: Session) {
  if (!session.isAuthenticated || session.role !== 'admin') {
    redirect('/login');
  }
}
