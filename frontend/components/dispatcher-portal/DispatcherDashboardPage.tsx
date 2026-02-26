import Link from 'next/link';
import type { DispatcherProfile } from '@/types/api';

export type DispatcherStats = {
  total_deliveries?: number;
  completed_deliveries?: number;
  pending_deliveries?: number;
  today_deliveries?: number;
  earnings?: string | number;
};

const VEHICLE_EMOJI: Record<string, string> = {
  bicycle: '🚲',
  motorbike: '🏍️',
  car: '🚗',
  van: '🚐',
};

function StatusBanner({ status }: { status?: string }) {
  if (!status || status === 'approved') return null;

  if (status === 'pending') {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <span className="text-xl">⏳</span>
        <div>
          <p className="font-semibold text-amber-800">Account pending approval</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Your dispatcher account is under review. You will be notified once an admin approves your application.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <span className="text-xl">❌</span>
        <div>
          <p className="font-semibold text-red-800">Application not approved</p>
          <p className="mt-0.5 text-sm text-red-700">
            Your dispatcher application was not approved. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-card">
      <p className="text-2xl">{icon}</p>
      <p className="mt-3 text-2xl font-bold text-brand-text">{value}</p>
      <p className="mt-1 text-sm text-brand-muted">{label}</p>
    </div>
  );
}

export function DispatcherDashboardPage({
  profile,
  stats,
}: {
  profile: DispatcherProfile | null;
  stats: DispatcherStats | null;
}) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'DX';

  const vehicleEmoji = VEHICLE_EMOJI[profile?.vehicle_type ?? ''] ?? '🚚';

  return (
    <div>
      <StatusBanner status={profile?.status} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-brand-muted">Here&apos;s your dispatcher overview.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Deliveries" value={stats?.today_deliveries ?? 0}      icon="📦" />
        <StatCard label="Completed"           value={stats?.completed_deliveries ?? 0} icon="✅" />
        <StatCard label="Pending"             value={stats?.pending_deliveries ?? 0}   icon="⏳" />
        <StatCard label="Earnings"            value={`£${Number(stats?.earnings ?? 0).toFixed(2)}`} icon="💰" />
      </div>

      {/* Profile + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile summary */}
        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-brand-text">Dispatcher Profile</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-brand-text">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-brand-text">{profile?.full_name || '—'}</p>
              <p className="text-sm text-brand-muted">{profile?.id_number ? `ID: ${profile.id_number}` : 'ID not set'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-brand-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Vehicle</span>
              <span className="font-medium text-brand-text">{vehicleEmoji} {profile?.vehicle_type ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Plate</span>
              <span className="font-medium text-brand-text">{profile?.plate_number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Service area</span>
              <span className="font-medium text-brand-text">{profile?.service_area || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Availability</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                profile?.availability === 'available'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {profile?.availability === 'available' ? 'On duty' : 'Off duty'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Status</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                profile?.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : profile?.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {profile?.status ?? 'pending'}
              </span>
            </div>
          </div>
          <Link
            href="/dispatcher/profile"
            className="mt-4 block w-full rounded-xl border border-brand-border py-2 text-center text-sm font-medium text-brand-text hover:bg-slate-50"
          >
            Edit profile →
          </Link>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-brand-text">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dispatcher/profile"
              className="flex items-center gap-3 rounded-xl border border-brand-border p-4 hover:bg-slate-50"
            >
              <span className="text-xl">✏️</span>
              <div>
                <p className="text-sm font-semibold text-brand-text">Update profile</p>
                <p className="text-xs text-brand-muted">Edit vehicle info, service area &amp; availability</p>
              </div>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 rounded-xl border border-brand-border p-4 hover:bg-slate-50"
            >
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-semibold text-brand-text">Messages</p>
                <p className="text-xs text-brand-muted">View your conversations</p>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl border border-brand-border p-4 hover:bg-slate-50"
            >
              <span className="text-xl">🏠</span>
              <div>
                <p className="text-sm font-semibold text-brand-text">Back to home</p>
                <p className="text-xs text-brand-muted">Browse the Bunchfood marketplace</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
