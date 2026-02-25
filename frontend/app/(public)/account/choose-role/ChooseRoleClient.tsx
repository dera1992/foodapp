'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ConfirmCTA } from '@/components/role/ConfirmCTA';
import { RolePageHeader } from '@/components/role/PageHeader';
import { RolesGrid } from '@/components/role/RolesGrid';
import type { RoleOption, UserRole } from '@/types/role';
import { authChooseRole } from '@/lib/api/endpoints';

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
    redirectTo: '/account/customer/setup/'
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
      await authChooseRole(selectedRole.id as 'customer' | 'shop' | 'dispatcher');
      // Update the role cookie so session reads the new role immediately
      document.cookie = `role=${selectedRole.id}; Max-Age=${30 * 24 * 3600}; path=/; SameSite=Lax`;
      toast.success('Role saved! Taking you to setup…');
      router.push(selectedRole.redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save your account type right now. Please try again.';
      setError(msg);
      toast.error(msg);
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

