'use client';

import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createAdminShop, patchAdminShop, deleteAdminShop } from '@/lib/api/endpoints';
import type { Shop } from '@/types/api';

type ShopForm = {
  name: string;
  address: string;
  city: string;
  description: string;
  phone: string;
  email: string;
};

const EMPTY_FORM: ShopForm = { name: '', address: '', city: '', description: '', phone: '', email: '' };

interface Props {
  initialShops: Shop[];
}

export function ShopsAdminClient({ initialShops }: Props) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ShopForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (shop: Shop) => {
    setEditId(shop.id);
    setForm({
      name: shop.name,
      address: shop.address ?? '',
      city: shop.city ?? '',
      description: shop.description ?? '',
      phone: shop.phone ?? '',
      email: shop.email ?? '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Shop name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const updated = await patchAdminShop(editId, form);
        setShops((prev) => prev.map((s) => (s.id === editId ? updated : s)));
      } else {
        const created = await createAdminShop(form);
        setShops((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shop? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteAdminShop(id);
      setShops((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const field = (key: keyof ShopForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text">Manage Shops</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark"
        >
          <Plus size={15} /> Add Shop
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-brand-text">{editId ? 'Edit Shop' : 'New Shop'}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Shop Name *</span>
              <input className="bf-int-input" placeholder="e.g. Green Leaf Market" {...field('name')} />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">City</span>
              <input className="bf-int-input" placeholder="e.g. London" {...field('city')} />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Address</span>
              <input className="bf-int-input" placeholder="Street address" {...field('address')} />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Phone</span>
              <input className="bf-int-input" placeholder="+44..." {...field('phone')} />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Email</span>
              <input className="bf-int-input" type="email" placeholder="shop@example.com" {...field('email')} />
            </label>
            <label className="bf-int-field sm:col-span-2">
              <span className="text-xs font-medium text-brand-muted">Description</span>
              <textarea
                className="bf-int-input min-h-[72px] resize-y"
                placeholder="Short shop description…"
                {...field('description')}
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-50"
            >
              <Check size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted hover:bg-gray-50"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {shops.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-muted">No shops yet. Add one above.</p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-white overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-brand-muted">
                <th className="py-3 px-4">Shop</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id} className="border-t border-brand-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-brand-text">{shop.name}</div>
                    {shop.address && <div className="text-xs text-brand-muted">{shop.address}</div>}
                  </td>
                  <td className="py-3 px-4 text-brand-muted">{shop.city || '–'}</td>
                  <td className="py-3 px-4 text-brand-muted">{shop.phone || '–'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        shop.isOpen
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(shop)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === shop.id}
                        onClick={() => handleDelete(shop.id)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
