import { Card } from '@/components/ui/Card';

export function BudgetBreakdownPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
      <p className="mt-2 text-sm text-brand-muted">{text}</p>
    </Card>
  );
}
