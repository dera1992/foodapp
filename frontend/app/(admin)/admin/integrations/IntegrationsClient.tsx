'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { getShopIntegrations, createIntegration, patchIntegration, deleteIntegration } from '@/lib/api/endpoints';
import type { ShopIntegration } from '@/types/api';

const EMPTY_FORM: Partial<ShopIntegration> = { name: '', provider: '', api_key: '', webhook_url: '', is_active: true };

export function IntegrationsClient() {
  const [items, setItems] = useState<ShopIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ShopIntegration>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getShopIntegrations().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (item: ShopIntegration) => {
    setEditId(item.id);
    setForm({ name: item.name, provider: item.provider, api_key: item.api_key, webhook_url: item.webhook_url, is_active: item.is_active });
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
    if (!form.name?.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const updated = await patchIntegration(editId, form);
        setItems((prev) => prev.map((it) => (it.id === editId ? updated : it)));
      } else {
        const created = await createIntegration(form);
        setItems((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ShopIntegration) => {
    try {
      const updated = await patchIntegration(item.id, { is_active: !item.is_active });
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    setDeletingId(id);
    try {
      await deleteIntegration(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text">Shop Integrations</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark"
        >
          <Plus size={15} /> Add Integration
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-brand-text">{editId ? 'Edit Integration' : 'New Integration'}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Name *</span>
              <input
                className="bf-int-input"
                value={form.name ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Stripe, Mailchimp"
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Provider</span>
              <input
                className="bf-int-input"
                value={form.provider ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                placeholder="e.g. stripe"
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">API Key</span>
              <input
                className="bf-int-input"
                type="password"
                value={form.api_key ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, api_key: e.target.value }))}
                placeholder="sk_live_..."
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Webhook URL</span>
              <input
                className="bf-int-input"
                value={form.webhook_url ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, webhook_url: e.target.value }))}
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_active ?? true}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            {form.is_active ? <ToggleRight size={22} className="text-brand-primary" /> : <ToggleLeft size={22} className="text-brand-muted" />}
            <span className="text-sm text-brand-text">{form.is_active ? 'Active' : 'Inactive'}</span>
          </label>

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

      {loading ? (
        <p className="py-8 text-center text-sm text-brand-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-muted">No integrations yet. Add one above.</p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-white overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-brand-muted">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Webhook</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-brand-border hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-brand-text">{item.name}</td>
                  <td className="py-3 px-4 text-brand-muted">{item.provider || '–'}</td>
                  <td className="py-3 px-4 text-brand-muted truncate max-w-[180px]">
                    {item.webhook_url || '–'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      title="Toggle active"
                      onClick={() => handleToggleActive(item)}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      {item.is_active ? (
                        <><ToggleRight size={18} className="text-brand-primary" /> <span className="text-brand-primary">Active</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-brand-muted" /> <span className="text-brand-muted">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
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
