'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Lightbulb, ListChecks, Plus, PlusCircle, Save, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import {
  addBudgetItem,
  createBudget,
  getBudget,
  getSavedBudgets,
  removeBudgetItem,
  saveTemplate,
  updateBudgetItem
} from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';
import type { BudgetInsight, BudgetSummary } from '@/types/api';

type BudgetPlannerClientProps = {
  initialBudget: BudgetSummary | null;
  initialSavedBudgets: BudgetSummary[];
  initialInsights: BudgetInsight[];
};

type Offer = { id: string; name: string; price: number; emoji: string };

const offerPool: Offer[] = [
  { id: 'offer-1', name: 'Versatile Greens', price: 1, emoji: 'V' },
  { id: 'offer-2', name: 'Broccoli Crown', price: 0.4, emoji: 'B' },
  { id: 'offer-3', name: 'Carrots Bunch', price: 0.45, emoji: 'C' },
  { id: 'offer-4', name: 'Mixed Peppers', price: 0.8, emoji: 'P' }
];

const categoryColors = ['#4caf63', '#f5a623', '#3b82f6', '#8b5cf6', '#e84040'];

export function BudgetPlannerClient({ initialBudget, initialSavedBudgets, initialInsights }: BudgetPlannerClientProps) {
  const [budget, setBudget] = useState<BudgetSummary | null>(initialBudget);
  const [savedBudgets, setSavedBudgets] = useState<BudgetSummary[]>(initialSavedBudgets);
  const [insights] = useState<BudgetInsight[]>(initialInsights);
  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [templateName, setTemplateName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const spent = budget?.spent ?? 0;
  const totalBudget = budget?.monthlyLimit ?? 0;
  const remaining = budget?.remaining ?? totalBudget - spent;
  const isOverBudget = remaining < 0;
  const percentUsed = totalBudget > 0 ? Math.min(100, Math.round((spent / totalBudget) * 1000) / 10) : 0;

  const breakdown = useMemo(() => {
    if (!budget?.items?.length) return [];
    const grouped = budget.items.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || 'Uncategorised';
      acc[key] = (acc[key] || 0) + item.price * item.quantity;
      return acc;
    }, {});
    return Object.entries(grouped).map(([category, amount], index) => ({
      category,
      amount,
      color: categoryColors[index % categoryColors.length]
    }));
  }, [budget?.items]);

  const offers = offerPool.filter((offer) => offer.price <= Math.max(remaining, 0)).slice(0, 4);

  const syncBudget = () => {
    startTransition(async () => {
      const nextBudget = await getBudget().catch(() => budget);
      if (nextBudget) setBudget(nextBudget);
      const nextSaved = await getSavedBudgets().catch(() => ({ data: savedBudgets }));
      setSavedBudgets(nextSaved.data);
    });
  };

  const onAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nameInput.trim()) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await addBudgetItem({ name: nameInput.trim(), quantity: qtyInput, price: 0 });
        setBudget(next);
        setNameInput('');
        setQtyInput(1);
      } catch {
        setNotice('Unable to add item right now.');
      }
    });
  };

  const onChangeQty = (id: string, nextQty: number) => {
    if (nextQty < 1) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await updateBudgetItem(id, { quantity: nextQty });
        setBudget(next);
      } catch {
        setNotice('Unable to update quantity.');
      }
    });
  };

  const onRemove = (id: string) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await removeBudgetItem(id);
        setBudget(next);
      } catch {
        setNotice('Unable to remove item.');
      }
    });
  };

  const onDuplicate = () => {
    if (!budget) return;
    setNotice(null);
    startTransition(async () => {
      try {
        await createBudget({ name: `${budget.name} copy`, monthlyLimit: budget.monthlyLimit });
        syncBudget();
      } catch {
        setNotice('Could not duplicate budget.');
      }
    });
  };

  const onAddFromCart = () => {
    setNotice('Add-from-cart endpoint is not mapped yet.');
  };

  const onSaveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateName.trim() || !budget) return;
    setNotice(null);
    startTransition(async () => {
      try {
        await saveTemplate({ name: templateName.trim(), monthlyLimit: budget.monthlyLimit });
        setTemplateName('');
      } catch {
        setNotice('Unable to save template.');
      }
    });
  };

  const onCreateBudget = () => {
    setNotice(null);
    startTransition(async () => {
      try {
        await createBudget({ name: `Budget ${savedBudgets.length + 1}`, monthlyLimit: totalBudget > 0 ? totalBudget : 100 });
        syncBudget();
      } catch {
        setNotice('Could not create budget.');
      }
    });
  };

  const onQuickAddOffer = (offer: Offer) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await addBudgetItem({ name: offer.name, quantity: 1, price: offer.price });
        setBudget(next);
      } catch {
        setNotice('Unable to add offer item.');
      }
    });
  };

  const firstInsight = insights[0]?.body ?? 'Discount available today. Consider buying near-expiry staples now.';
  const secondInsight = insights[1]?.body ?? `You still have ${formatCurrency(Math.max(0, remaining))} remaining for extra savings picks.`;

  return (
    <div className="bf-budget-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shopping Budget Planner' }]} />
      <div className="bf-budget-header">
        <h1>
          Shopping <span>Budget Planner</span>
        </h1>
        <p>Plan your shopping, track your spending, stay on budget.</p>
      </div>

      <div className="bf-budget-layout">
        <section className="bf-budget-left">
          <article className="bf-budget-card">
            <div className="bf-budget-overview-head">
              <h2>Budget Overview</h2>
              <div className="bf-budget-stats">
                <div className="bf-budget-stat">
                  <p>Total Budget</p>
                  <strong>{formatCurrency(totalBudget)}</strong>
                </div>
                <div className="bf-budget-stat">
                  <p>Planned Spend</p>
                  <strong className="is-accent">{formatCurrency(spent)}</strong>
                </div>
                <div className="bf-budget-stat">
                  <p>Remaining</p>
                  <strong className={isOverBudget ? 'is-danger' : 'is-green'}>{formatCurrency(remaining)}</strong>
                </div>
              </div>
            </div>

            <div className="bf-budget-progress-wrap">
              <div className="bf-budget-progress-label">
                <span>Budget used</span>
                <strong>{percentUsed}% used</strong>
              </div>
              <div className="bf-budget-progress-track">
                <div className={`bf-budget-progress-fill ${isOverBudget ? 'is-over' : ''}`} style={{ width: `${Math.min(percentUsed, 100)}%` }} />
              </div>
            </div>

            <div className="bf-budget-actions">
              <button type="button" className="bf-budget-btn is-dark" onClick={onDuplicate} disabled={isPending || !budget}>
                <Copy className="h-4 w-4" />
                Duplicate Budget
              </button>
              <button type="button" className="bf-budget-btn is-sage" onClick={onAddFromCart}>
                <ShoppingCart className="h-4 w-4" />
                Add Items From Cart
              </button>
              <Link prefetch={false} href="/cart" className="bf-budget-btn is-amber">
                <ArrowRight className="h-4 w-4" />
                Proceed to Checkout
              </Link>
            </div>

            <div className={`bf-budget-status ${isOverBudget ? 'is-warn' : 'is-ok'}`}>
              {isOverBudget ? `You are ${formatCurrency(Math.abs(remaining))} over budget.` : 'You are within budget. Keep planning your list.'}
            </div>
          </article>

          <article className="bf-budget-card bf-budget-card-pad">
            <h3 className="bf-budget-card-title">
              <PlusCircle className="h-4 w-4" />
              Add Products To Your Shopping List
            </h3>
            <form className="bf-budget-add-form" onSubmit={onAddItem}>
              <div className="bf-budget-field product-field">
                <label>Product</label>
                <input value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Search products..." />
              </div>
              <div className="bf-budget-field">
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={(event) => setQtyInput(Math.max(1, Number.parseInt(event.target.value || '1', 10)))}
                />
              </div>
              <button type="submit" className="bf-budget-btn is-green" disabled={isPending}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            </form>
          </article>

          <article className="bf-budget-card">
            <div className="bf-budget-list-head">
              <h3>Your Shopping List</h3>
              <Link prefetch={false} href="/cart" className="bf-budget-btn is-amber is-sm">
                Proceed to Checkout
              </Link>
            </div>
            <div className="bf-budget-table-head">
              <span>Product</span>
              <span>Unit Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span />
            </div>
            {budget?.items?.length ? (
              <div>
                {budget.items.map((item) => {
                  const unit = item.price;
                  const total = unit * item.quantity;
                  const unmatched = unit <= 0;
                  return (
                    <div key={item.id} className="bf-budget-row">
                      <div>
                        <p className="bf-budget-product">{item.name}</p>
                        {item.category ? <p className="bf-budget-shop">{item.category}</p> : null}
                        {unmatched ? <span className="bf-budget-badge">Unmatched</span> : null}
                      </div>
                      <p className="bf-budget-price">{formatCurrency(unit)}</p>
                      <div className="bf-budget-qty">
                        <button type="button" onClick={() => onChangeQty(item.id, item.quantity - 1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => onChangeQty(item.id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <p className="bf-budget-price total">{formatCurrency(total)}</p>
                      <button type="button" className="bf-budget-del" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bf-budget-empty">
                <ListChecks className="h-10 w-10" />
                <p>Your shopping list is empty</p>
                <small>Use the form above to add products.</small>
              </div>
            )}
          </article>
        </section>

        <aside className="bf-budget-right">
          <article className="bf-budget-card bf-budget-card-pad">
            <h3 className="bf-budget-card-title">Budget Breakdown</h3>
            {breakdown.length ? (
              <div className="bf-breakdown">
                {breakdown.map((row) => {
                  const width = spent > 0 ? Math.min(100, (row.amount / spent) * 100) : 0;
                  return (
                    <div key={row.category} className="bf-breakdown-row">
                      <div className="bf-breakdown-label">
                        <span className="dot" style={{ backgroundColor: row.color }} />
                        {row.category}
                      </div>
                      <div className="bar">
                        <span style={{ width: `${width}%`, backgroundColor: row.color }} />
                      </div>
                      <strong>{formatCurrency(row.amount)}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="bf-budget-muted">No categories yet.</p>
            )}
          </article>

          <article className="bf-budget-card bf-budget-card-pad">
            <h3 className="bf-budget-card-title">Budget-Friendly Offers</h3>
            <p className="bf-budget-muted">Within your remaining {formatCurrency(Math.max(0, remaining))}</p>
            {offers.length ? (
              offers.map((offer) => (
                <div key={offer.id} className="bf-offer-row">
                  <div className="thumb">{offer.emoji}</div>
                  <p className="name">{offer.name}</p>
                  <strong className="price">{formatCurrency(offer.price)}</strong>
                  <button type="button" onClick={() => onQuickAddOffer(offer)}>
                    +
                  </button>
                </div>
              ))
            ) : (
              <p className="bf-budget-muted">No available offers within current budget.</p>
            )}
          </article>

          <article className="bf-budget-card bf-budget-card-pad is-discount">
            <h3 className="bf-budget-card-title">
              <Lightbulb className="h-4 w-4" />
              Discount Suggestions
            </h3>
            <p>
              We will suggest discounted items based on your remaining budget. You currently have <strong>{formatCurrency(Math.max(0, remaining))}</strong>{' '}
              available.
            </p>
          </article>

          <article className="bf-budget-card bf-budget-card-pad">
            <h3 className="bf-budget-card-title">Reusable Templates</h3>
            <form className="bf-template-form" onSubmit={onSaveTemplate}>
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name..." />
              <button type="submit" className="bf-budget-btn is-dark is-sm" disabled={isPending}>
                <Save className="h-4 w-4" />
                Save
              </button>
            </form>
            <p className="bf-budget-muted">Save this plan as a template to reuse in the future.</p>
          </article>

          <article className="bf-budget-card bf-budget-card-pad is-ai">
            <h3 className="bf-budget-card-title">
              <Sparkles className="h-4 w-4" />
              AI-Driven Budget Insights
            </h3>
            <div className="bf-ai-block">
              <p className="label">Price predictions</p>
              <p>{firstInsight}</p>
            </div>
            <hr />
            <div className="bf-ai-block">
              <p className="label">Savings suggestions</p>
              <p>{secondInsight}</p>
            </div>
          </article>

          <article className="bf-budget-card bf-budget-card-pad">
            <h3 className="bf-budget-card-title">Saved Budgets</h3>
            {savedBudgets.length ? (
              savedBudgets.map((item) => (
                <div key={item.id} className={`bf-saved-item ${budget?.id === item.id ? 'active' : ''}`}>
                  <div className="top">
                    <strong>Budget {formatCurrency(item.monthlyLimit)}</strong>
                    <span>{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <p>
                    Spent <span className="spent">{formatCurrency(item.spent)}</span> - Remaining{' '}
                    <span className="remaining">{formatCurrency(item.remaining)}</span>
                  </p>
                </div>
              ))
            ) : (
              <p className="bf-budget-muted">No saved budgets yet.</p>
            )}
            <button type="button" className="bf-budget-btn is-green bf-full" onClick={onCreateBudget} disabled={isPending}>
              <Plus className="h-4 w-4" />
              Create a new budget
            </button>
          </article>
        </aside>
      </div>

      {notice ? <p className="bf-budget-notice">{notice}</p> : null}
    </div>
  );
}
