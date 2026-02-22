import { PlanCard } from '@/components/onboarding/PlanCard';
import { StepFooter } from '@/components/onboarding/StepFooter';
import type { ShopPlanData, SubscriptionPlan } from '@/types/onboarding';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 'free',
    features: ['Up to 10 products', 'Basic analytics', 'Standard support']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    features: ['Up to 50 products', 'Full analytics', 'Priority support', 'AI suggestions'],
    recommended: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 24.99,
    features: ['Unlimited products', 'Advanced analytics', 'Dedicated support', 'Custom branding']
  }
];

type ShopPlanStepProps = {
  plan: ShopPlanData;
  loading?: boolean;
  onUpdate: (patch: Partial<ShopPlanData>) => void;
  onBack: () => void;
  onFinish: () => void;
};

export function ShopPlanStep({ plan, loading, onUpdate, onBack, onFinish }: ShopPlanStepProps) {
  return (
    <>
      <header className="bf-onboard-step-header">
        <h2>Choose Your Plan</h2>
        <p>Pick a subscription to activate your shop.</p>
      </header>

      <div className="bf-onboard-step-body">
        <div className="bf-onboard-plan-grid">
          {PLANS.map((entry) => (
            <PlanCard
              key={entry.id}
              plan={entry}
              selected={plan.planId === entry.id}
              onSelect={(selected) => onUpdate({ planId: selected.id, planName: selected.name })}
            />
          ))}
        </div>
      </div>

      <StepFooter
        backLabel="<- Back"
        continueLabel="Finish Setup ✓"
        continueDisabled={!plan.planId}
        loading={loading}
        onBack={onBack}
        onContinue={onFinish}
      />
    </>
  );
}

