import { Card } from '@/components/ui/Card';

export default function AdminHomePage() {
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <p className="mt-2 text-sm text-brand-muted">Use the sidebar to manage analytics, products, orders, and customers.</p>
    </Card>
  );
}