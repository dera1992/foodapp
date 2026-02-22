import type { SubscriptionPlan } from '@/types/onboarding';

type PlanCardProps = {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
};

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <article className={`bf-onboard-plan-card ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(plan)}>
      {plan.recommended ? <span className="bf-onboard-plan-badge">Most Popular</span> : null}
      <h3>{plan.name}</h3>
      <p className="bf-onboard-plan-price">
        {plan.price === 'free' ? 'Free' : `£${plan.price.toFixed(2)}`}
        {plan.price === 'free' ? null : <small>/month</small>}
      </p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}

