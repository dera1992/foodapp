'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, Save, ShieldCheck, Store, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import type { Session } from '@/lib/auth/session';

type UserRole = NonNullable<Session['role']>;

type ProfileForm = {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  bio: string;
  customerDeliveryNote: string;
  customerDietary: string;
  customerHouseholdSize: string;
  shopName: string;
  shopCategory: string;
  shopHours: string;
  shopDescription: string;
  dispatcherVehicle: string;
  dispatcherPlate: string;
  dispatcherServiceArea: string;
  dispatcherAvailability: string;
};

type PasswordForm = {
  old_password: string;
  new_password1: string;
  new_password2: string;
};

type RoleMeta = {
  title: string;
  subtitle: string;
  badge: string;
  icon: ReactNode;
  accent: string;
};

const PROFILE_DEFAULTS: ProfileForm = {
  displayName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  bio: '',
  customerDeliveryNote: '',
  customerDietary: '',
  customerHouseholdSize: '',
  shopName: '',
  shopCategory: '',
  shopHours: '',
  shopDescription: '',
  dispatcherVehicle: '',
  dispatcherPlate: '',
  dispatcherServiceArea: '',
  dispatcherAvailability: ''
};

const PASSWORD_DEFAULTS: PasswordForm = {
  old_password: '',
  new_password1: '',
  new_password2: ''
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

function backendUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? `${base}${path}` : path;
}

function roleMeta(role: UserRole): RoleMeta {
  if (role === 'admin') {
    return {
      title: 'Admin Settings',
      subtitle: 'Manage shared account details and review customer, shop, and dispatcher profile settings in one place.',
      badge: 'Admin',
      icon: <ShieldCheck className="h-5 w-5" />,
      accent: 'from-emerald-700 to-teal-500'
    };
  }

  if (role === 'shop') {
    return {
      title: 'Shop Settings',
      subtitle: 'Manage your store profile, contact details, and operating information customers will see.',
      badge: 'Shop Owner',
      icon: <Store className="h-5 w-5" />,
      accent: 'from-emerald-600 to-green-500'
    };
  }

  if (role === 'dispatcher') {
    return {
      title: 'Dispatcher Settings',
      subtitle: 'Keep your dispatch profile, vehicle details, and availability up to date for order assignments.',
      badge: 'Dispatcher',
      icon: <Truck className="h-5 w-5" />,
      accent: 'from-sky-600 to-cyan-500'
    };
  }

  return {
    title: 'Customer Settings',
    subtitle: 'Manage your personal profile, delivery preferences, and account security in one place.',
    badge: 'Customer',
    icon: <User className="h-5 w-5" />,
    accent: 'from-emerald-600 to-lime-500'
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeProfilePayload(payload: unknown, session?: Session): ProfileForm {
  const raw =
    Array.isArray(payload) ? payload[0] :
    payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)
      ? (payload as { results?: unknown[] }).results?.[0]
      : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
        ? (payload as { data?: unknown[] }).data?.[0]
        : payload;

  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const shop = record.shop && typeof record.shop === 'object' ? (record.shop as Record<string, unknown>) : null;
  const dispatcher = record.dispatcher && typeof record.dispatcher === 'object' ? (record.dispatcher as Record<string, unknown>) : null;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = record[key] ?? shop?.[key] ?? dispatcher?.[key];
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }
    return '';
  };

  const role = session?.role ?? 'customer';

  return {
    ...PROFILE_DEFAULTS,
    displayName: pick('full_name', 'name', 'username', 'first_name') || `${titleCase(role)} User`,
    email: pick('email') || (session?.userId ? `user-${session.userId}@bunchfood.com` : ''),
    phone: pick('phone', 'phone_number', 'mobile'),
    city: pick('city', 'town'),
    address: pick('address', 'location'),
    bio: pick('bio', 'about', 'description'),
    customerDeliveryNote: pick('delivery_note', 'delivery_notes'),
    customerDietary: pick('dietary_preference', 'dietary_preferences'),
    customerHouseholdSize: pick('household_size'),
    shopName: pick('shop_name', 'store_name', 'name'),
    shopCategory: pick('shop_category', 'category'),
    shopHours: pick('opening_hours', 'hours'),
    shopDescription: pick('shop_description', 'description'),
    dispatcherVehicle: pick('vehicle_type', 'vehicle'),
    dispatcherPlate: pick('plate_number', 'plate_no'),
    dispatcherServiceArea: pick('service_area', 'coverage_area'),
    dispatcherAvailability: pick('availability', 'availability_window')
  };
}

function profileEndpointCandidates(role?: Session['role']) {
  switch (role) {
    case 'shop':
    case 'admin':
      return ['/api/account/shops/me/', backendUrl('/account/shops/me/'), backendUrl('/account/shops/')];
    case 'dispatcher':
      return ['/api/account/dispatcher/profile/', backendUrl('/account/dispatcher/profile/'), backendUrl('/dispatcher/profile/')];
    case 'customer':
    default:
      return ['/api/account/profile/', backendUrl('/account/profile/'), backendUrl('/home/profile/')];
  }
}

function passwordEndpointCandidates() {
  return ['/account/change-password/', '/api/account/change-password/', backendUrl('/account/change-password/')];
}

async function tryFetchProfile(role?: Session['role']) {
  let lastError: unknown;
  for (const url of profileEndpointCandidates(role)) {
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) continue;
        throw new Error(`Profile request failed (${res.status})`);
      }
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) return null;
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function trySaveProfile(role: Session['role'], payload: ProfileForm) {
  const csrf = getCookie('csrftoken');
  let lastError: unknown;

  for (const url of profileEndpointCandidates(role)) {
    for (const method of ['PATCH', 'PUT'] as const) {
      try {
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrf ? { 'X-CSRFToken': csrf } : {})
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) return true;
        if (res.status === 404 || res.status === 405) continue;
        const text = await res.text();
        throw new Error(text || `Save failed (${res.status})`);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError ?? new Error('Unable to save profile');
}

async function tryChangePassword(payload: PasswordForm) {
  const csrf = getCookie('csrftoken');
  let lastError: unknown;

  for (const url of passwordEndpointCandidates()) {
    try {
      const formData = new FormData();
      formData.append('old_password', payload.old_password);
      formData.append('new_password1', payload.new_password1);
      formData.append('new_password2', payload.new_password2);

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRFToken': csrf } : {})
        },
        body: formData
      });

      if (res.ok) return true;
      if (res.status === 404) continue;
      const text = await res.text();
      throw new Error(text || `Password change failed (${res.status})`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unable to change password');
}

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-brand-muted">
      {label}
    </label>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete
}: {
  id: keyof PasswordForm;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} />
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted hover:bg-slate-100"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SettingsDashboardPage({ session }: { session?: Session }) {
  const role = (session?.role ?? 'customer') as UserRole;
  const meta = roleMeta(role);

  const [profile, setProfile] = useState<ProfileForm>(() => normalizeProfilePayload(null, session));
  const [draft, setDraft] = useState<ProfileForm>(() => normalizeProfilePayload(null, session));
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(PASSWORD_DEFAULTS);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingProfile(true);
      setProfileError('');
      try {
        const payload = await tryFetchProfile(role);
        if (cancelled) return;
        const normalized = normalizeProfilePayload(payload, session);
        setProfile(normalized);
        setDraft(normalized);
      } catch {
        if (!cancelled) {
          const fallback = normalizeProfilePayload(null, session);
          setProfile(fallback);
          setDraft(fallback);
          setProfileError('Live profile data could not be loaded. You can still edit and save when the endpoint is available.');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [role, session]);

  const passwordsMatch = useMemo(
    () => passwordForm.new_password1.length > 0 && passwordForm.new_password1 === passwordForm.new_password2,
    [passwordForm.new_password1, passwordForm.new_password2]
  );

  const canSubmitPassword =
    passwordForm.old_password.trim() !== '' &&
    passwordForm.new_password1.trim() !== '' &&
    passwordForm.new_password2.trim() !== '' &&
    passwordsMatch;

  const updateDraft = (key: keyof ProfileForm, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');
    try {
      await trySaveProfile(role, draft);
      setProfile(draft);
      setEditing(false);
      setProfileMessage('Profile updated successfully.');
    } catch {
      setProfileError('Unable to save profile right now. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitPassword) return;
    setPasswordSaving(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      await tryChangePassword(passwordForm);
      setPasswordForm(PASSWORD_DEFAULTS);
      setPasswordMessage('Password changed successfully.');
    } catch {
      setPasswordError('Unable to change password right now. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const headerName = role === 'shop' || role === 'admin' ? (profile.shopName || profile.displayName) : profile.displayName;

  return (
    <div className="bg-brand-background py-8 md:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-card">
          <div className={`relative bg-gradient-to-r ${meta.accent} p-6 text-white md:p-8`}>
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_30%,white_0,transparent_40%)]" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                  {meta.icon}
                  <span>{meta.badge} Settings</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{meta.title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">{meta.subtitle}</p>
              </div>
              <div className="rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.1em] text-white/80">Active Profile</p>
                <p className="mt-1 text-lg font-semibold">{headerName || 'Account Profile'}</p>
                <p className="text-sm text-white/80">{profile.email || 'Email not set'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="bg-white p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-text">Profile Information</h2>
                  <p className="text-sm text-brand-muted">Update the details shown across your dashboard and account.</p>
                </div>
                <div className="flex gap-2">
                  {!editing ? (
                    <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setDraft(profile);
                          setEditing(false);
                          setProfileError('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={() => void submitProfile()} disabled={savingProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {profileMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{profileMessage}</div> : null}
              {profileError ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{profileError}</div> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="displayName" label={role === 'shop' || role === 'admin' ? 'Owner / Admin name' : 'Full name'} />
                  <Input id="displayName" value={draft.displayName} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('displayName', e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="email" label="Email address" />
                  <Input id="email" type="email" value={draft.email} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('email', e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="phone" label="Phone number" />
                  <Input id="phone" value={draft.phone} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('phone', e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="city" label="City" />
                  <Input id="city" value={draft.city} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('city', e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <FieldLabel htmlFor="address" label={role === 'dispatcher' ? 'Base address' : role === 'shop' || role === 'admin' ? 'Business address' : 'Address'} />
                <Input id="address" value={draft.address} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('address', e.target.value)} />
              </div>

              <div className="mt-4">
                <FieldLabel htmlFor="bio" label={role === 'shop' || role === 'admin' ? 'Owner bio' : 'About'} />
                <Textarea id="bio" rows={4} value={draft.bio} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('bio', e.target.value)} />
              </div>
            </Card>

            {(role === 'customer' || role === 'admin') && (
              <Card className="bg-white p-5 md:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-brand-text">Customer Preferences</h3>
                  <p className="text-sm text-brand-muted">Use these details to personalize shopping and delivery.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="customerDietary" label="Dietary preference" />
                    <Select id="customerDietary" value={draft.customerDietary} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('customerDietary', e.target.value)}>
                      <option value="">Select preference</option>
                      <option value="none">No preference</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="halal">Halal</option>
                      <option value="gluten-free">Gluten-free</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="customerHouseholdSize" label="Household size" />
                    <Input id="customerHouseholdSize" value={draft.customerHouseholdSize} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('customerHouseholdSize', e.target.value)} placeholder="e.g. 4" />
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel htmlFor="customerDeliveryNote" label="Delivery note" />
                  <Textarea id="customerDeliveryNote" rows={3} value={draft.customerDeliveryNote} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('customerDeliveryNote', e.target.value)} placeholder="Gate code, landmark, best delivery time..." />
                </div>
              </Card>
            )}

            {(role === 'shop' || role === 'admin') && (
              <Card className="bg-white p-5 md:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-brand-text">Shop Profile</h3>
                  <p className="text-sm text-brand-muted">These details help customers discover and trust your store.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="shopName" label="Shop name" />
                    <Input id="shopName" value={draft.shopName} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('shopName', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="shopCategory" label="Shop category" />
                    <Select id="shopCategory" value={draft.shopCategory} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('shopCategory', e.target.value)}>
                      <option value="">Select category</option>
                      <option value="grocery">Grocery</option>
                      <option value="bakery">Bakery</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="produce">Produce</option>
                      <option value="pharmacy">Pharmacy</option>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel htmlFor="shopHours" label="Opening hours" />
                    <Input id="shopHours" value={draft.shopHours} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('shopHours', e.target.value)} placeholder="Mon-Sat 8:00 AM - 9:00 PM" />
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel htmlFor="shopDescription" label="Shop description" />
                  <Textarea id="shopDescription" rows={4} value={draft.shopDescription} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('shopDescription', e.target.value)} placeholder="Tell customers what your shop offers and what makes it special." />
                </div>
              </Card>
            )}

            {(role === 'dispatcher' || role === 'admin') && (
              <Card className="bg-white p-5 md:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-brand-text">Dispatch Details</h3>
                  <p className="text-sm text-brand-muted">Keep these details accurate for delivery assignments and contact.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="dispatcherVehicle" label="Vehicle type" />
                    <Select id="dispatcherVehicle" value={draft.dispatcherVehicle} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('dispatcherVehicle', e.target.value)}>
                      <option value="">Select vehicle</option>
                      <option value="bike">Bike</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="dispatcherPlate" label="Plate number" />
                    <Input id="dispatcherPlate" value={draft.dispatcherPlate} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('dispatcherPlate', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="dispatcherServiceArea" label="Service area" />
                    <Input id="dispatcherServiceArea" value={draft.dispatcherServiceArea} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('dispatcherServiceArea', e.target.value)} placeholder="Lekki / Surulere / Island route" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="dispatcherAvailability" label="Availability window" />
                    <Input id="dispatcherAvailability" value={draft.dispatcherAvailability} disabled={!editing || loadingProfile} onChange={(e) => updateDraft('dispatcherAvailability', e.target.value)} placeholder="Mon-Sun 7AM - 8PM" />
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-primary" />
                <h2 className="text-lg font-semibold text-brand-text">Account Summary</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-xl bg-brand-background px-3 py-3">
                  <User className="mt-0.5 h-4 w-4 text-brand-primary" />
                  <div>
                    <p className="font-semibold text-brand-text">{profile.displayName || 'No name set'}</p>
                    <p className="text-brand-muted">{meta.badge}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-brand-background px-3 py-3">
                  <Mail className="mt-0.5 h-4 w-4 text-brand-primary" />
                  <div>
                    <p className="font-semibold text-brand-text">Email</p>
                    <p className="text-brand-muted">{profile.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-brand-background px-3 py-3">
                  <Phone className="mt-0.5 h-4 w-4 text-brand-primary" />
                  <div>
                    <p className="font-semibold text-brand-text">Phone</p>
                    <p className="text-brand-muted">{profile.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-brand-background px-3 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-brand-primary" />
                  <div>
                    <p className="font-semibold text-brand-text">Location</p>
                    <p className="text-brand-muted">{[profile.city, profile.address].filter(Boolean).join(' • ') || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card id="password" className="bg-white p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-brand-primary" />
                <h2 className="text-lg font-semibold text-brand-text">Change Password</h2>
              </div>
              <p className="mb-4 text-sm text-brand-muted">Use a strong password to protect your account and activity history.</p>

              {passwordMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{passwordMessage}</div> : null}
              {passwordError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</div> : null}

              <form onSubmit={submitPassword} className="space-y-4">
                <PasswordInput
                  id="old_password"
                  label="Current password"
                  value={passwordForm.old_password}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, old_password: value }))}
                  show={showPwd.current}
                  onToggle={() => setShowPwd((current) => ({ ...current, current: !current.current }))}
                  autoComplete="current-password"
                />

                <div>
                  <PasswordInput
                    id="new_password1"
                    label="New password"
                    value={passwordForm.new_password1}
                    onChange={(value) => setPasswordForm((current) => ({ ...current, new_password1: value }))}
                    show={showPwd.next}
                    onToggle={() => setShowPwd((current) => ({ ...current, next: !current.next }))}
                    autoComplete="new-password"
                  />
                  <div className="mt-2">
                    <PasswordStrength password={passwordForm.new_password1} />
                  </div>
                </div>

                <PasswordInput
                  id="new_password2"
                  label="Confirm new password"
                  value={passwordForm.new_password2}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, new_password2: value }))}
                  show={showPwd.confirm}
                  onToggle={() => setShowPwd((current) => ({ ...current, confirm: !current.confirm }))}
                  autoComplete="new-password"
                />

                {passwordForm.new_password2 && !passwordsMatch ? (
                  <p className="text-sm font-medium text-red-600">Passwords do not match.</p>
                ) : null}

                <Button type="submit" className="w-full" disabled={!canSubmitPassword || passwordSaving}>
                  {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
