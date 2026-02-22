import { Card } from '@/components/ui/Card';

export function BudgetBreakdown({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-brand-text">Breakdown</h3>
      <div className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-brand-muted">{row.label}</span>
            <span className="font-semibold text-brand-text">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
