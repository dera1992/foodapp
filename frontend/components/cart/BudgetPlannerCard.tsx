import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/money';

type BudgetPlannerCardProps = {
  totalBudget: number;
  plannedSpend: number;
  remaining: number;
};

export function BudgetPlannerCard({ totalBudget, plannedSpend, remaining }: BudgetPlannerCardProps) {
  const progress = totalBudget > 0 ? Math.min(100, Math.round((plannedSpend / totalBudget) * 100)) : 0;
  const overBudget = remaining < 0;

  return (
    <section className="bf-budget-card">
      <h2>Shopping Budget Planner</h2>
      <p>Track your spending against your plan.</p>
      <div className="bf-summary-row">
        <span>Total budget</span>
        <strong>{formatCurrency(totalBudget)}</strong>
      </div>
      <div className="bf-summary-row">
        <span>Planned spend</span>
        <strong>{formatCurrency(plannedSpend)}</strong>
      </div>
      <div className="bf-summary-row">
        <span>Remaining</span>
        <strong className={overBudget ? 'text-brand-danger' : 'text-brand-primaryDark'}>{formatCurrency(remaining)}</strong>
      </div>
      <div className="bf-budget-progress">
        <div className={`bf-budget-progress-fill ${overBudget ? 'is-over' : ''}`} style={{ width: `${progress}%` }} />
      </div>
      <p className={`bf-budget-status ${overBudget ? 'is-over' : ''}`}>
        {overBudget ? `You're over budget by ${formatCurrency(Math.abs(remaining))}.` : 'You are within budget. Keep planning your list.'}
      </p>
      <div className="bf-budget-actions">
        <Link prefetch={false} href="/budget-planner" className="bf-budget-primary">
          View Budget Plan
        </Link>
        <Link prefetch={false} href="/budget-planner" className="bf-budget-secondary">
          Add Cart Items
        </Link>
      </div>
    </section>
  );
}
