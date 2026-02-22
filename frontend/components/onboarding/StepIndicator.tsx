import type { OnboardingStep } from '@/types/onboarding';

const STEPS: Array<{ key: OnboardingStep; label: string }> = [
  { key: 'info', label: 'Shop Info' },
  { key: 'address', label: 'Address' },
  { key: 'documents', label: 'Documents' },
  { key: 'plan', label: 'Plan' }
];

export function StepIndicator({ currentStep }: { currentStep: OnboardingStep }) {
  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);
  const progressPercent = (stepIndex / (STEPS.length - 1)) * 100;

  return (
    <section className="bf-onboard-indicator" aria-label="Onboarding progress">
      <div className="bf-onboard-labels">
        {STEPS.map((step, index) => (
          <span
            key={step.key}
            className={`bf-onboard-label ${index <= stepIndex ? 'is-done' : ''} ${index === stepIndex ? 'is-active' : ''}`}
          >
            {step.label}
          </span>
        ))}
      </div>
      <div className="bf-onboard-track" aria-hidden="true">
        <div className="bf-onboard-fill" style={{ width: `${progressPercent}%` }} />
        {STEPS.map((step, index) => (
          <span
            key={step.key}
            className={`bf-onboard-dot ${index <= stepIndex ? 'is-done' : ''}`}
            style={{ left: `${(index / (STEPS.length - 1)) * 100}%` }}
          />
        ))}
      </div>
    </section>
  );
}

