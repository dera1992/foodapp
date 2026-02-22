import { Card } from '@/components/ui/Card';
import { ProgressBar } from './ProgressBar';

export function BudgetOverview({ spent, limit }: { spent: number; limit: number }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-brand-text">Budget overview</h3>
      <p className="mt-2 text-sm text-brand-muted">You have used {Math.round((spent / limit) * 100)}% of your monthly budget.</p>
      <div className="mt-4">
        <ProgressBar value={spent} max={limit} />
      </div>
    </Card>
  );
}
