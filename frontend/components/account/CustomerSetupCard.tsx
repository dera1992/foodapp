'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Info, Mail, MapPin, Phone } from 'lucide-react';

interface SetupForm {
  phone:      string;
  address:    string;
  city:       string;
  postalCode: string;
}

interface FieldProps {
  label:     string;
  required?: boolean;
  error?:    string;
  icon:      React.ReactNode;
  children:  React.ReactNode;
}

function Field({ label, required, error, icon, children }: FieldProps) {
  return (
    <div className="bf-cs-field">
      <label className="bf-cs-field-label">
        {label}
        {required && <span className="bf-cs-required">*</span>}
      </label>
      <div className="bf-cs-input-wrap">
        <span className="bf-cs-input-icon">{icon}</span>
        {children}
      </div>
      {error && <p className="bf-cs-field-error">{error}</p>}
    </div>
  );
}

function getBackendOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
}

export function CustomerSetupCard() {
  const router = useRouter();
  const [form, setForm] = useState<SetupForm>({ phone: '', address: '', city: '', postalCode: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SetupForm>>({});

  const update = (field: keyof SetupForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Partial<SetupForm> = {};
    if (!form.phone.trim())   errs.phone   = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Street address is required';
    if (!form.city.trim())    errs.city    = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const origin = getBackendOrigin();
      const res = await fetch(`${origin}/api/account/customer/setup/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:       form.phone,
          address:     form.address,
          city:        form.city,
          postal_code: form.postalCode,
        }),
      });
      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.errors) {
          setErrors({
            phone:   data.errors.phone?.[0],
            address: data.errors.address?.[0],
            city:    data.errors.city?.[0],
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bf-cs-card">

      {/* Progress bar — step 2 of 3 */}
      <div className="bf-cs-progress-bar">
        <div className="bf-cs-progress-fill" style={{ width: '50%' }} />
      </div>

      {/* Green gradient header */}
      <div className="bf-cs-card-header">
        <div className="bf-cs-step-indicator">
          <div className="bf-cs-step-dot done" />
          <div className="bf-cs-step-dot active" />
          <div className="bf-cs-step-dot" />
        </div>
        <div className="bf-cs-header-icon">👤</div>
        <h1>Complete Your Profile</h1>
        <p>Add your contact details so shops can fulfil your orders.</p>
      </div>

      {/* Form body */}
      <div className="bf-cs-card-body">

        <div className="bf-cs-section-label">Contact Information</div>

        <Field label="Phone" required error={errors.phone} icon={<Phone size={15} />}>
          <input
            type="tel"
            className={`bf-cs-field-input${errors.phone ? ' error' : ''}`}
            placeholder="eg: +234 8030 793 112"
            value={form.phone}
            onChange={update('phone')}
          />
        </Field>
        <p className="bf-cs-field-hint">
          <Info size={11} /> Used for delivery updates and order notifications.
        </p>

        <div className="bf-cs-section-label" style={{ marginTop: 20 }}>Delivery Address</div>

        <Field label="Street Address" required error={errors.address} icon={<MapPin size={15} />}>
          <input
            type="text"
            className={`bf-cs-field-input${errors.address ? ' error' : ''}`}
            placeholder="Enter your street address"
            value={form.address}
            onChange={update('address')}
          />
        </Field>

        <div className="bf-cs-field-row">
          <Field label="City" required error={errors.city} icon={<Building2 size={15} />}>
            <input
              type="text"
              className={`bf-cs-field-input${errors.city ? ' error' : ''}`}
              placeholder="City"
              value={form.city}
              onChange={update('city')}
            />
          </Field>

          <Field label="Postal Code" icon={<Mail size={15} />}>
            <input
              type="text"
              className="bf-cs-field-input"
              placeholder="e.g. M1 1AA"
              value={form.postalCode}
              onChange={update('postalCode')}
            />
          </Field>
        </div>

      </div>

      {/* Footer buttons */}
      <div className="bf-cs-card-footer">
        <button
          className="bf-cs-btn-skip"
          onClick={() => router.push('/')}
          disabled={loading}
        >
          Skip for now
        </button>
        <button
          className="bf-cs-btn-finish"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="bf-cs-spinner" />
          ) : (
            <>Finish Setup <ArrowRight size={15} /></>
          )}
        </button>
      </div>

    </div>
  );
}
