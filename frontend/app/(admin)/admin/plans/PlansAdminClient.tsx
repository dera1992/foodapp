'use client';

import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { createSubscriptionPlan, patchSubscriptionPlan, deleteSubscriptionPlan } from '@/lib/api/endpoints';
import type { SubscriptionPlan } from '@/types/api';

type PlanForm = {
  name: string;
  price: string;
  product_limit: string;
  features: string;
  is_active: boolean;
};

const EMPTY_FORM: PlanForm = { name: '', price: '', product_limit: '', features: '', is_active: true };

interface Props {
  initialPlans: SubscriptionPlan[];
}

function toPayload(form: PlanForm): Partial<SubscriptionPlan> {
  return {
    name: form.name.trim(),
    price: Number(form.price) || 0,
    product_limit: form.product_limit ? Number(form.product_limit) : undefined,
    features: form.features ? form.features.split('\n').map((f) => f.trim()).filter(Boolean) : [],
    is_active: form.is_active,
  };
}

export function PlansAdminClient({ initialPlans }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      product_limit: plan.product_limit != null ? String(plan.product_limit) : '',
      features: (plan.features ?? []).join('\n'),
      is_active: plan.is_active ?? true,
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
    if (!form.name.trim()) { setError('Plan name is required.'); return; }
    if (!form.price || Number(form.price) < 0) { setError('A valid price is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (editId) {
        const updated = await patchSubscriptionPlan(editId, payload);
        setPlans((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      } else {
        const created = await createSubscriptionPlan(payload);
        setPlans((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const updated = await patchSubscriptionPlan(plan.id, { is_active: !plan.is_active });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription plan?')) return;
    setDeletingId(id);
    try {
      await deleteSubscriptionPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text">Subscription Plans</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark"
        >
          <Plus size={15} /> Add Plan
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-brand-text">{editId ? 'Edit Plan' : 'New Plan'}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Plan Name *</span>
              <input
                className="bf-int-input"
                placeholder="e.g. Starter, Pro"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Price (£) *</span>
              <input
                className="bf-int-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Product Limit</span>
              <input
                className="bf-int-input"
                type="number"
                min="0"
                placeholder="Leave blank for unlimited"
                value={form.product_limit}
                onChange={(e) => setForm((p) => ({ ...p, product_limit: e.target.value }))}
              />
            </label>
            <label className="bf-int-field sm:col-span-2">
              <span className="text-xs font-medium text-brand-muted">Features (one per line)</span>
              <textarea
                className="bf-int-input min-h-[80px] resize-y"
                placeholder={"Full analytics\nPriority support\nAI suggestions"}
                value={form.features}
                onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            {form.is_active
              ? <ToggleRight size={22} className="text-brand-primary" />
              : <ToggleLeft size={22} className="text-brand-muted" />}
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

      {plans.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-muted">No subscription plans yet. Add one above.</p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-white overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-brand-muted">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Product Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-brand-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-brand-text">{plan.name}</div>
                    {plan.features && plan.features.length > 0 && (
                      <div className="text-xs text-brand-muted">{plan.features.slice(0, 2).join(' · ')}{plan.features.length > 2 ? ' …' : ''}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-brand-text">
                    {plan.price === 0 ? 'Free' : `£${plan.price.toFixed(2)}/mo`}
                  </td>
                  <td className="py-3 px-4 text-brand-muted">
                    {plan.product_limit != null ? plan.product_limit : 'Unlimited'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      title="Toggle active"
                      onClick={() => handleToggleActive(plan)}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      {plan.is_active
                        ? <><ToggleRight size={18} className="text-brand-primary" /><span className="text-brand-primary">Active</span></>
                        : <><ToggleLeft size={18} className="text-brand-muted" /><span className="text-brand-muted">Inactive</span></>}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(plan)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === plan.id}
                        onClick={() => handleDelete(plan.id)}
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
