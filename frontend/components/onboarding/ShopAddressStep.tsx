'use client';

import { useEffect, useState } from 'react';
import { StepFooter } from '@/components/onboarding/StepFooter';
import type { ShopAddressData } from '@/types/onboarding';

type ShopAddressStepProps = {
  address: ShopAddressData;
  loading?: boolean;
  onUpdate: (patch: Partial<ShopAddressData>) => void;
  onBack: () => void;
  onContinue: () => void;
};

function getApiOrigin() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return '';
  try {
    return new URL(apiBase).origin;
  } catch {
    return '';
  }
}

export function ShopAddressStep({ address, loading, onUpdate, onBack, onContinue }: ShopAddressStepProps) {
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation || address.locationCaptured) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const origin = getApiOrigin();
          const response = await fetch(`${origin}/api/geocode/?lat=${coords.latitude}&lng=${coords.longitude}`);
          if (!response.ok) throw new Error('No geocode');
          const data = (await response.json()) as Partial<{
            address: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            postal_code: string;
          }>;
          onUpdate({
            address: data.address ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            country: data.country ?? '',
            postalCode: data.postalCode ?? data.postal_code ?? '',
            locationCaptured: true
          });
        } catch {
          setGeoError(true);
        }
      },
      () => setGeoError(true)
    );
  }, [address.locationCaptured, onUpdate]);

  return (
    <>
      <header className="bf-onboard-step-header">
        <h2>Shop Address</h2>
        <p>Add your shop location so customers can find you.</p>
      </header>
      <div className="bf-onboard-step-body">
        {address.locationCaptured ? <p className="bf-onboard-geo-ok">Location captured from your browser.</p> : null}
        {geoError ? <p className="bf-onboard-geo-note">Could not auto-detect location. Please fill in manually.</p> : null}

        <div className="bf-onboard-field">
          <label htmlFor="onb-address">Address</label>
          <input
            id="onb-address"
            type="text"
            name="address"
            placeholder="Address"
            value={address.address}
            onChange={(event) => onUpdate({ address: event.target.value })}
          />
        </div>

        <div className="bf-onboard-grid-2">
          <div className="bf-onboard-field">
            <label htmlFor="onb-city">City</label>
            <input
              id="onb-city"
              type="text"
              name="city"
              placeholder="City"
              value={address.city}
              onChange={(event) => onUpdate({ city: event.target.value })}
            />
          </div>
          <div className="bf-onboard-field">
            <label htmlFor="onb-state">State</label>
            <input
              id="onb-state"
              type="text"
              name="state"
              placeholder="State"
              value={address.state}
              onChange={(event) => onUpdate({ state: event.target.value })}
            />
          </div>
        </div>

        <div className="bf-onboard-grid-2">
          <div className="bf-onboard-field">
            <label htmlFor="onb-country">Country</label>
            <input
              id="onb-country"
              type="text"
              name="country"
              placeholder="Country"
              value={address.country}
              onChange={(event) => onUpdate({ country: event.target.value })}
            />
          </div>
          <div className="bf-onboard-field">
            <label htmlFor="onb-postal">Postal Code</label>
            <input
              id="onb-postal"
              type="text"
              name="postal_code"
              placeholder="Postal code"
              value={address.postalCode}
              onChange={(event) => onUpdate({ postalCode: event.target.value })}
            />
          </div>
        </div>
      </div>
      <StepFooter
        backLabel="<- Back"
        continueLabel="Continue ->"
        continueDisabled={!address.address.trim() || !address.city.trim()}
        loading={loading}
        onBack={onBack}
        onContinue={onContinue}
      />
    </>
  );
}

