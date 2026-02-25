'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { patchAdminUser, deleteAdminUser } from '@/lib/api/endpoints';
import type { AdminUser } from '@/types/api';

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  pending: 'Pending',
  customer: 'Customer',
  shop: 'Shop Owner',
  dispatcher: 'Dispatcher',
};

const ROLE_COLOURS: Record<AdminUser['role'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  customer: 'bg-blue-100 text-blue-700',
  shop: 'bg-emerald-100 text-emerald-700',
  dispatcher: 'bg-purple-100 text-purple-700',
};

type UserForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
  role: AdminUser['role'];
  is_active: boolean;
};

interface Props {
  initialUsers: AdminUser[];
}

export function UsersAdminClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>({ first_name: '', last_name: '', phone_number: '', role: 'customer', is_active: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const openEdit = (user: AdminUser) => {
    setEditId(user.id);
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      role: user.role,
      is_active: user.is_active,
    });
    setError('');
  };

  const closeEdit = () => {
    setEditId(null);
    setError('');
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    setError('');
    try {
      const updated = await patchAdminUser(editId, form);
      setUsers((prev) => prev.map((u) => (u.id === editId ? updated : u)));
      closeEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const updated = await patchAdminUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this user account?')) return;
    setDeletingId(id);
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-brand-text">Manage Users</h2>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bf-int-input max-w-xs"
        />
      </div>

      {editId && (
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-brand-text">Edit User</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">First Name</span>
              <input
                className="bf-int-input"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Last Name</span>
              <input
                className="bf-int-input"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Phone</span>
              <input
                className="bf-int-input"
                value={form.phone_number}
                onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
              />
            </label>
            <label className="bf-int-field">
              <span className="text-xs font-medium text-brand-muted">Role</span>
              <select
                className="bf-int-input"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AdminUser['role'] }))}
              >
                <option value="pending">Pending</option>
                <option value="customer">Customer</option>
                <option value="shop">Shop Owner</option>
                <option value="dispatcher">Dispatcher</option>
              </select>
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
            <span className="text-sm text-brand-text">{form.is_active ? 'Active' : 'Suspended'}</span>
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
              onClick={closeEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted hover:bg-gray-50"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-muted">
          {search ? 'No users match your search.' : 'No users found.'}
        </p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-white overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-brand-muted">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-brand-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-brand-text">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-brand-muted">{user.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOURS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      title="Toggle active"
                      onClick={() => handleToggleActive(user)}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                    >
                      {user.is_active
                        ? <><ToggleRight size={18} className="text-brand-primary" /><span className="text-brand-primary">Active</span></>
                        : <><ToggleLeft size={18} className="text-brand-muted" /><span className="text-brand-muted">Suspended</span></>}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-brand-muted text-xs">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-GB') : '–'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-1.5 text-brand-muted hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === user.id}
                        onClick={() => handleDelete(user.id)}
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
          <div className="px-4 py-2 text-xs text-brand-muted border-t border-brand-border">
            {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
