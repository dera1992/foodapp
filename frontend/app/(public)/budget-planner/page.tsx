import { BudgetPlannerClient } from '@/components/budget/BudgetPlannerClient';
import { getBudget, getInsights, getSavedBudgets } from '@/lib/api/endpoints';
import type { BudgetSummary } from '@/types/api';

export default async function BudgetPlannerPage() {
  const [budgetResult, savedResult, insightResult] = await Promise.allSettled([getBudget(), getSavedBudgets(), getInsights()]);

  const budget: BudgetSummary | null = budgetResult.status === 'fulfilled' ? budgetResult.value : null;
  const savedBudgets = savedResult.status === 'fulfilled' ? savedResult.value.data : [];
  const insights = insightResult.status === 'fulfilled' ? insightResult.value.insights : [];

  return <BudgetPlannerClient initialBudget={budget} initialSavedBudgets={savedBudgets} initialInsights={insights} />;
}

