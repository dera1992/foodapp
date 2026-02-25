'use client';

import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { markNotificationRead, markAllNotificationsRead, deleteShopNotification } from '@/lib/api/endpoints';
import type { ShopNotification } from '@/types/api';

interface Props {
  initialNotifications: ShopNotification[];
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ShopNotificationsClient({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<ShopNotification[]>(initialNotifications);
  const [processing, setProcessing] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (notification: ShopNotification) => {
    if (notification.is_read) return;
    setProcessing(notification.id);
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? updated : n)));
    } catch {
      // silently fail
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessing(id);
    try {
      await deleteShopNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently fail
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-text">
            Shop <span className="text-brand-primary">Notifications</span>
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Updates from shops you&apos;ve subscribed to.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primaryLight disabled:opacity-50"
          >
            <Check size={14} />
            {markingAll ? 'Marking…' : `Mark all read (${unreadCount})`}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length > 0 ? (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-brand-primaryLight/30'
              }`}
            >
              {/* Icon */}
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-brand-primary/10 text-brand-primary'
                }`}
              >
                <Bell size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {n.shop_name && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    {n.shop_name}
                  </p>
                )}
                <p className={`text-sm ${n.is_read ? 'text-brand-muted' : 'font-medium text-brand-text'}`}>
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">{formatRelativeTime(n.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {!n.is_read && (
                  <button
                    type="button"
                    title="Mark as read"
                    disabled={processing === n.id}
                    onClick={() => handleMarkRead(n)}
                    className="rounded-lg p-1.5 text-brand-primary hover:bg-brand-primaryLight disabled:opacity-40"
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  type="button"
                  title="Delete"
                  disabled={processing === n.id}
                  onClick={() => handleDelete(n.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <span className="text-4xl">🔔</span>
          <p className="mt-3 font-semibold text-brand-text">No notifications yet.</p>
          <p className="mt-1 text-sm text-brand-muted">
            Subscribe to shops to receive updates when new deals are added.
          </p>
        </div>
      )}
    </div>
  );
}
