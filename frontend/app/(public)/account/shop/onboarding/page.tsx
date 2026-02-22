'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { ShopInfoStep } from '@/components/onboarding/ShopInfoStep';
import { ShopAddressStep } from '@/components/onboarding/ShopAddressStep';
import { ShopDocumentsStep } from '@/components/onboarding/ShopDocumentsStep';
import { ShopPlanStep } from '@/components/onboarding/ShopPlanStep';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function ShopOnboardingPage() {
  const router = useRouter();
  const {
    state,
    updateInfo,
    updateAddress,
    updateDocuments,
    updatePlan,
    goBack,
    goNext,
    submitInfo,
    submitAddress,
    submitDocuments,
    submitPlan
  } = useOnboarding();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const content = useMemo(() => {
    if (success) {
      return (
        <section className="bf-onboard-success">
          <div className="bf-onboard-success-icon">🎉</div>
          <h2>
            Your shop is <span>live!</span>
          </h2>
          <p>Welcome to bunchfood. You can now add products and start selling.</p>
          <button type="button" className="bf-onboard-next-btn" onClick={() => router.push('/admin?onboarding=complete')}>
            Go to Dashboard {'>'}
          </button>
        </section>
      );
    }

    switch (state.currentStep) {
      case 'info':
        return (
          <ShopInfoStep
            info={state.info}
            loading={loading}
            onUpdate={updateInfo}
            onContinue={async () => {
              setLoading(true);
              setError(null);
              try {
                await submitInfo();
                goNext();
              } catch {
                setError('Unable to save shop basics right now.');
              } finally {
                setLoading(false);
              }
            }}
          />
        );
      case 'address':
        return (
          <ShopAddressStep
            address={state.address}
            loading={loading}
            onUpdate={updateAddress}
            onBack={goBack}
            onContinue={async () => {
              setLoading(true);
              setError(null);
              try {
                await submitAddress();
                goNext();
              } catch {
                setError('Unable to save shop address right now.');
              } finally {
                setLoading(false);
              }
            }}
          />
        );
      case 'documents':
        return (
          <ShopDocumentsStep
            documents={state.documents}
            loading={loading}
            onUpdate={updateDocuments}
            onBack={goBack}
            onContinue={async () => {
              setLoading(true);
              setError(null);
              try {
                await submitDocuments();
                goNext();
              } catch {
                setError('Unable to upload document right now.');
              } finally {
                setLoading(false);
              }
            }}
          />
        );
      case 'plan':
        return (
          <ShopPlanStep
            plan={state.plan}
            loading={loading}
            onUpdate={updatePlan}
            onBack={goBack}
            onFinish={async () => {
              setLoading(true);
              setError(null);
              try {
                await submitPlan();
                setSuccess(true);
              } catch {
                setError('Something went wrong while finishing setup.');
              } finally {
                setLoading(false);
              }
            }}
          />
        );
      default:
        return null;
    }
  }, [
    error,
    goBack,
    goNext,
    loading,
    router,
    state.address,
    state.currentStep,
    state.documents,
    state.info,
    state.plan,
    submitAddress,
    submitDocuments,
    submitInfo,
    submitPlan,
    success,
    updateAddress,
    updateDocuments,
    updateInfo,
    updatePlan
  ]);

  return (
    <section className="bf-onboard-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop Onboarding' }]} />
      <div className="bf-onboard-wrap">
        {!success ? <StepIndicator currentStep={state.currentStep} /> : null}
        <article key={success ? 'success' : state.currentStep} className="bf-onboard-step-card">
          {content}
          {error ? <p className="bf-onboard-error">{error}</p> : null}
        </article>
      </div>
    </section>
  );
}
