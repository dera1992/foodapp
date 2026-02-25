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

interface NominatimResponse {
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<Partial<ShopAddressData>> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!response.ok) throw new Error('Nominatim error');
  const data = (await response.json()) as NominatimResponse;
  const a = data.address ?? {};
  const streetParts = [a.house_number, a.road].filter(Boolean);
  return {
    address: streetParts.join(' '),
    city: a.city ?? a.town ?? a.village ?? '',
    state: a.state ?? '',
    country: a.country ?? '',
    postalCode: a.postcode ?? '',
    latitude: Math.round(lat * 1e6) / 1e6,
    longitude: Math.round(lon * 1e6) / 1e6,
    locationCaptured: true,
  };
}

export function ShopAddressStep({ address, loading, onUpdate, onBack, onContinue }: ShopAddressStepProps) {
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoLoading(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const patch = await reverseGeocode(coords.latitude, coords.longitude);
          onUpdate(patch);
        } catch {
          onUpdate({
            latitude: Math.round(coords.latitude * 1e6) / 1e6,
            longitude: Math.round(coords.longitude * 1e6) / 1e6,
            locationCaptured: true,
          });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError(true);
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (address.locationCaptured) return;
    captureLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="bf-onboard-step-header">
        <h2>Shop Address</h2>
        <p>Add your shop location so customers can find you.</p>
      </header>
      <div className="bf-onboard-step-body">
        <div className="bf-onboard-geo-row">
          {address.locationCaptured ? (
            <p className="bf-onboard-geo-ok">Location captured automatically.</p>
          ) : geoLoading ? (
            <p className="bf-onboard-geo-note">Detecting your location…</p>
          ) : (
            <button type="button" className="bf-onboard-geo-btn" onClick={captureLocation}>
              Use my current location
            </button>
          )}
          {geoError ? <p className="bf-onboard-geo-note">Could not detect location. Please fill in manually or try again.</p> : null}
        </div>

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

