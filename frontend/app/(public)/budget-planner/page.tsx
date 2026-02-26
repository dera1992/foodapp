import { BudgetPlannerClient } from '@/components/budget/BudgetPlannerClient';
import { getBudget, getInsights, getSavedBudgets } from '@/lib/api/endpoints';
import type { BudgetSummary } from '@/types/api';

type BudgetPlannerPageProps = {
  searchParams?: Promise<{ budgetId?: string | string[] }>;
};

export default async function BudgetPlannerPage({ searchParams }: BudgetPlannerPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const budgetId = Array.isArray(params?.budgetId) ? params?.budgetId[0] : params?.budgetId;
  const [budgetResult, savedResult, insightResult] = await Promise.allSettled([getBudget(budgetId), getSavedBudgets(), getInsights()]);

  const budget: BudgetSummary | null = budgetResult.status === 'fulfilled' ? budgetResult.value : null;
  const savedBudgets = savedResult.status === 'fulfilled' ? savedResult.value.data : [];
  const insights = insightResult.status === 'fulfilled' ? insightResult.value.insights : [];

  return <BudgetPlannerClient initialBudget={budget} initialSavedBudgets={savedBudgets} initialInsights={insights} />;
}
