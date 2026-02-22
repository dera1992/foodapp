import { Card } from '@/components/ui/Card';

export function BudgetTemplates() {
  const templates = ['Student Saver', 'Family Essentials', 'Weekly Fresh Picks'];
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-brand-text">Templates</h3>
      <ul className="mt-4 space-y-2 text-sm text-brand-text">
        {templates.map((template) => (
          <li key={template} className="rounded-xl bg-slate-50 px-3 py-2">{template}</li>
        ))}
      </ul>
    </Card>
  );
}
