'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DispatcherStepIndicator } from '@/components/dispatcher/StepIndicator';
import { PersonalStep } from '@/components/dispatcher/PersonalStep';
import { VehicleStep } from '@/components/dispatcher/VehicleStep';
import { DispatcherSuccessScreen } from '@/components/dispatcher/SuccessScreen';
import type { DispatcherStep, PersonalData, VehicleData } from '@/types/dispatcher';

function backendOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
}

export function DispatcherOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<DispatcherStep>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [personal, setPersonal] = useState<PersonalData>({
    fullName: '',
    phone: '',
    idNumber: '',
    dob: '',
    idDocument: null,
    idFileName: null
  });

  const [vehicle, setVehicle] = useState<VehicleData>({
    vehicleType: 'bicycle',
    plateNumber: '',
    vehicleModel: '',
    vehicleDocument: null,
    vehicleFileName: null
  });

  const submitStep1 = async () => {
    const fd = new FormData();
    fd.append('full_name', personal.fullName);
    fd.append('phone', personal.phone);
    fd.append('id_number', personal.idNumber);
    fd.append('dob', personal.dob);
    if (personal.idDocument) fd.append('id_document', personal.idDocument);
    const res = await fetch(`${backendOrigin()}/account/dispatcher/personal/`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    });
    if (!res.ok) throw new Error('personal failed');
  };

  const submitStep2 = async () => {
    const fd = new FormData();
    fd.append('vehicle_type', vehicle.vehicleType);
    fd.append('plate_number', vehicle.plateNumber);
    fd.append('vehicle_model', vehicle.vehicleModel);
    if (vehicle.vehicleDocument) fd.append('vehicle_document', vehicle.vehicleDocument);
    const res = await fetch(`${backendOrigin()}/account/dispatcher/vehicle/`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    });
    if (!res.ok) throw new Error('vehicle failed');
  };

  return (
    <section className="bf-dsp-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dispatcher Setup' }]} />

      <main className="bf-dsp-main-wrap">
        {step !== 'success' ? <DispatcherStepIndicator currentStep={step} /> : null}

        <div key={step} className="bf-dsp-step-card">
          {step === 'personal' ? (
            <PersonalStep
              personal={personal}
              loading={loading}
              onUpdate={(patch) => setPersonal((prev) => ({ ...prev, ...patch }))}
              onContinue={async () => {
                setLoading(true);
                setError('');
                try {
                  await submitStep1();
                  setStep('vehicle');
                } catch {
                  setError('Something went wrong. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : null}

          {step === 'vehicle' ? (
            <VehicleStep
              vehicle={vehicle}
              loading={loading}
              onUpdate={(patch) => setVehicle((prev) => ({ ...prev, ...patch }))}
              onBack={() => setStep('personal')}
              onSubmit={async () => {
                setLoading(true);
                setError('');
                try {
                  await submitStep2();
                  setStep('success');
                } catch {
                  setError('Something went wrong. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : null}

          {step === 'success' ? <DispatcherSuccessScreen onContinue={() => router.push('/dispatcher/dashboard/')} /> : null}
        </div>

        {error ? <p className="bf-dsp-error">{error}</p> : null}
      </main>
    </section>
  );
}

