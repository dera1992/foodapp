'use client';

import { useState } from 'react';
import { patchDispatcherProfile } from '@/lib/api/endpoints';
import type { DispatcherProfile } from '@/types/api';

const VEHICLE_OPTIONS = [
  { id: 'bicycle',  emoji: '🚲', label: 'Bicycle' },
  { id: 'motorbike', emoji: '🏍️', label: 'Motorbike' },
  { id: 'car',      emoji: '🚗', label: 'Car' },
  { id: 'van',      emoji: '🚐', label: 'Van' },
] as const;

export function DispatcherProfilePage({ profile }: { profile: DispatcherProfile | null }) {
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [serviceArea, setServiceArea]   = useState(profile?.service_area ?? '');
  const [vehicleModel, setVehicleModel] = useState(profile?.vehicle_model ?? '');
  const [availability, setAvailability] = useState<'available' | 'unavailable'>(
    profile?.availability === 'available' ? 'available' : 'unavailable',
  );

  if (!profile) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-card">
        <p className="text-brand-muted">Profile not found. Please complete your onboarding first.</p>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await patchDispatcherProfile(profile.id, { service_area: serviceArea, vehicle_model: vehicleModel, availability });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'DX';

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-brand-text">My Profile</h1>

      {/* Identity card */}
      <div className="mb-6 rounded-2xl border border-brand-border bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-brand-text">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-brand-text">{profile.full_name || '—'}</p>
            <p className="text-sm text-brand-muted">{profile.id_number ? `ID: ${profile.id_number}` : 'ID not set'}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
              profile.status === 'approved'
                ? 'bg-green-100 text-green-700'
                : profile.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {profile.status ?? 'pending'}
            </span>
          </div>
        </div>
        {/* Read-only info */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-brand-border pt-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Vehicle type</p>
            <p className="mt-1 font-medium text-brand-text capitalize">{profile.vehicle_type || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Plate number</p>
            <p className="mt-1 font-medium text-brand-text">{profile.plate_number || '—'}</p>
          </div>
          {profile.dob && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Date of birth</p>
              <p className="mt-1 font-medium text-brand-text">{profile.dob}</p>
            </div>
          )}
          {profile.phone && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Phone</p>
              <p className="mt-1 font-medium text-brand-text">{profile.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <form onSubmit={handleSave} className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
        <h2 className="mb-5 text-base font-semibold text-brand-text">Update details</h2>

        {/* Availability toggle */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-brand-text">Availability</p>
          <div className="flex gap-3">
            {(['available', 'unavailable'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAvailability(opt)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  availability === opt
                    ? opt === 'available'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-400 bg-slate-100 text-slate-700'
                    : 'border-brand-border bg-white text-brand-muted hover:bg-slate-50'
                }`}
              >
                {opt === 'available' ? '✅ On duty' : '⏸️ Off duty'}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle type (visual selector, read-only — set during onboarding) */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-brand-text">Vehicle type</p>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
                  profile.vehicle_type === opt.id
                    ? 'border-brand-primary bg-brand-primary/5 font-semibold text-brand-primary'
                    : 'border-brand-border text-brand-muted'
                }`}
              >
                {opt.emoji} {opt.label}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-brand-muted">Vehicle type is set during registration and cannot be changed here.</p>
        </div>

        {/* Vehicle model */}
        <div className="mb-5">
          <label htmlFor="vehicle-model" className="mb-1.5 block text-sm font-medium text-brand-text">
            Vehicle make / model
          </label>
          <input
            id="vehicle-model"
            type="text"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="e.g. Honda CB125"
            className="w-full rounded-xl border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {/* Service area */}
        <div className="mb-6">
          <label htmlFor="service-area" className="mb-1.5 block text-sm font-medium text-brand-text">
            Service area
          </label>
          <input
            id="service-area"
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="e.g. Central London, Manchester City Centre"
            className="w-full rounded-xl border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">Profile updated successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
