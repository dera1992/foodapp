import { Card } from '@/components/ui/Card';

export function BudgetList({ items }: { items: Array<{ id: string; name: string; qty: number; price: string }> }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-brand-text">Shopping list</h3>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-brand-border px-3 py-2 text-sm">
            <span className="text-brand-text">{item.name} x {item.qty}</span>
            <span className="font-semibold text-brand-primaryDark">{item.price}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
