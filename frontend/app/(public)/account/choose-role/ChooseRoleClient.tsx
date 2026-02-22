'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ConfirmCTA } from '@/components/role/ConfirmCTA';
import { RolePageHeader } from '@/components/role/PageHeader';
import { RolesGrid } from '@/components/role/RolesGrid';
import type { RoleOption, UserRole } from '@/types/role';

const ROLES: RoleOption[] = [
  {
    id: 'customer',
    emoji: '🛍️',
    title: "I'm a Customer",
    description: 'Browse near-expiry food deals from local shops and save up to 90% on your groceries.',
    pills: ['Browse deals', 'Budget planner', 'Wishlist'],
    colour: {
      border: 'var(--green)',
      bg: 'var(--green-light)',
      iconBg: 'var(--green-light)',
      pillBg: 'rgba(45,122,58,0.1)',
      pillText: 'var(--green-dark)',
      checkBg: 'var(--green)'
    },
    redirectTo: '/'
  },
  {
    id: 'shop',
    emoji: '🏪',
    title: "I'm a Shop Owner",
    description: 'List your near-expiry stock, reach local buyers, and reduce food waste from your store.',
    pills: ['List products', 'Analytics', 'Subscriptions'],
    colour: {
      border: 'var(--accent)',
      bg: '#fff8ed',
      iconBg: '#fff3e0',
      pillBg: 'rgba(245,166,35,0.12)',
      pillText: '#92400e',
      checkBg: 'var(--accent)'
    },
    redirectTo: '/account/shop/onboarding/'
  },
  {
    id: 'dispatcher',
    emoji: '🚚',
    title: "I'm a Dispatcher",
    description: 'Manage deliveries, handle pickups, and help connect shops with customers in your area.',
    pills: ['Manage routes', 'Pickup orders', 'Earnings'],
    colour: {
      border: 'var(--blue)',
      bg: 'var(--blue-light)',
      iconBg: 'var(--blue-light)',
      pillBg: 'rgba(59,130,246,0.12)',
      pillText: '#1e40af',
      checkBg: 'var(--blue)'
    },
    redirectTo: '/account/dispatcher/onboarding/'
  }
];

function getBackendOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
}

export function ChooseRoleClient() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedRole = useMemo(() => ROLES.find((r) => r.id === selected) ?? null, [selected]);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    try {
      const origin = getBackendOrigin();
      const response = await fetch(`${origin}/account/set-role/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole.id })
      });
      if (!response.ok) throw new Error('Failed to save role');
      router.push(selectedRole.redirectTo);
    } catch {
      setError('Unable to save your account type right now. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="bf-role-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Choose Role' }]} />

      <main className="bf-role-page-wrap">
        <div className="bf-role-main-wrap">
          <RolePageHeader />
          <RolesGrid roles={ROLES} selected={selected} onSelect={setSelected} />
          <ConfirmCTA selected={selectedRole} loading={loading} onConfirm={handleConfirm} error={error} />
        </div>
      </main>
    </section>
  );
}

