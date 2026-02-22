import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { BudgetFormCard } from '@/components/budget/BudgetFormCard';
import { WhyBudgetCard } from '@/components/budget/WhyBudgetCard';

export default function BudgetCreatePage() {
  return (
    <section className="bf-budget-create-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shopping Budget Planner' }, { label: 'Create Budget' }]} />
      <main className="bf-budget-create-wrap">
        <div className="bf-budget-create-grid">
          <BudgetFormCard />
          <WhyBudgetCard />
        </div>
      </main>
    </section>
  );
}

