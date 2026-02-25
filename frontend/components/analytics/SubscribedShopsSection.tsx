'use client';

import { useEffect, useState } from 'react';
import { TableCard } from '@/components/analytics/TableCard';
import { SectionEmptyState } from '@/components/analytics/SectionEmptyState';
import { getShopSubscriptions, deleteShopSubscription } from '@/lib/api/endpoints';
import type { ShopSubscription } from '@/types/api';

type SubscribedShop = {
  id: string;
  name: string;
  city?: string;
  subscribed: boolean;
};

interface Props {
  initialShops: SubscribedShop[];
}

export function SubscribedShopsSection({ initialShops }: Props) {
  const [shops, setShops] = useState<SubscribedShop[]>(initialShops);
  // Map shop id → subscription record id (needed to DELETE)
  const [subscriptionIds, setSubscriptionIds] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    getShopSubscriptions().then((subscriptions: ShopSubscription[]) => {
      const map: Record<string, string> = {};
      for (const s of subscriptions) {
        map[s.shop] = s.id;
      }
      setSubscriptionIds(map);

      // If server-side data was empty, populate from the live API response
      if (initialShops.length === 0 && subscriptions.length > 0) {
        setShops(
          subscriptions.map((s) => ({
            id: s.shop,
            name: s.shop_name ?? s.shop,
            city: s.shop_city,
            subscribed: true,
          }))
        );
      }
    }).catch(() => null);
  }, [initialShops.length]);

  const handleUnsubscribe = async (shop: SubscribedShop) => {
    const subscriptionId = subscriptionIds[shop.id];
    if (!subscriptionId) return;
    setRemoving(shop.id);
    try {
      await deleteShopSubscription(subscriptionId);
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
    } catch {
      // silently fail — UI stays unchanged
    } finally {
      setRemoving(null);
    }
  };

  return (
    <TableCard title="Subscribed Shops" actionLabel="Manage ->" actionHref="/shops" className="bg-white">
      {shops.length ? (
        <div className="space-y-1">
          {shops.map((row) => (
            <div key={row.id} className="bf-analytics-list-row group">
              <div className="bf-analytics-avatar">{row.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-text">{row.name}</p>
                <p className="text-xs text-brand-muted">{row.city || 'City unavailable'}</p>
              </div>
              <span className="rounded-full bg-brand-primaryLight px-3 py-1 text-xs font-semibold text-brand-primaryDark">
                Subscribed
              </span>
              <button
                type="button"
                disabled={removing === row.id || !subscriptionIds[row.id]}
                onClick={() => handleUnsubscribe(row)}
                className="hidden rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 group-hover:inline-flex disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removing === row.id ? '...' : 'Unsubscribe'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <SectionEmptyState
          emoji="🔔"
          title="No subscriptions yet."
          description="Subscribe to stores to get notified of new deals."
        />
      )}
    </TableCard>
  );
}
