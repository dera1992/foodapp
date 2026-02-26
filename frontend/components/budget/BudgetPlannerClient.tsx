'use client';

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Lightbulb, ListChecks, Pencil, Plus, PlusCircle, Save, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ApiError } from '@/lib/api/client';
import {
  addBudgetItem,
  addBudgetItemsFromCart,
  applyBudgetTemplate,
  createBudget,
  deleteBudget,
  deleteBudgetTemplate,
  duplicateBudget,
  getBudget,
  getBudgetById,
  getSavedBudgets,
  getBudgetTemplates,
  removeBudgetItem,
  saveTemplate,
  updateBudget,
  updateBudgetTemplate,
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

function toActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Please sign in to use budget features.';
  }
  return fallback;
}

export function BudgetPlannerClient({ initialBudget, initialSavedBudgets, initialInsights }: BudgetPlannerClientProps) {
  const [budget, setBudget] = useState<BudgetSummary | null>(initialBudget);
  const [savedBudgets, setSavedBudgets] = useState<BudgetSummary[]>(initialSavedBudgets);
  const [insights] = useState<BudgetInsight[]>(initialInsights);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; monthlyLimit: number; itemCount: number }>>([]);
  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [templateName, setTemplateName] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetAmount, setEditingBudgetAmount] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
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

  useEffect(() => {
    let active = true;
    getBudgetTemplates()
      .then((result) => {
        if (active) setTemplates(result.data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const syncBudget = () => {
    startTransition(async () => {
      const nextBudget = await getBudget().catch(() => budget);
      if (nextBudget) setBudget(nextBudget);
      const nextSaved = await getSavedBudgets().catch(() => ({ data: savedBudgets }));
      setSavedBudgets(nextSaved.data);
      const nextTemplates = await getBudgetTemplates().catch(() => ({ data: templates }));
      setTemplates(nextTemplates.data);
    });
  };

  const onAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nameInput.trim()) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await addBudgetItem({ name: nameInput.trim(), quantity: qtyInput, price: 0 }, budget?.id);
        setBudget(next);
        setNameInput('');
        setQtyInput(1);
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to add item right now.'));
      }
    });
  };

  const onChangeQty = (id: string, nextQty: number) => {
    if (nextQty < 1) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await updateBudgetItem(id, { quantity: nextQty }, budget?.id);
        setBudget(next);
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to update quantity.'));
      }
    });
  };

  const onRemove = (id: string) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await removeBudgetItem(id, budget?.id);
        setBudget(next);
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to remove item.'));
      }
    });
  };

  const onDuplicate = () => {
    if (!budget) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await duplicateBudget(budget.id);
        setBudget(next);
        syncBudget();
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Could not duplicate budget.'));
      }
    });
  };

  const onAddFromCart = () => {
    if (!budget?.id) {
      setNotice('Create or select a budget first.');
      return;
    }
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await addBudgetItemsFromCart(budget.id);
        setBudget(next);
        syncBudget();
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Could not import cart items into budget.'));
      }
    });
  };

  const onSaveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateName.trim() || !budget) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const created = await saveTemplate({
          name: templateName.trim(),
          monthlyLimit: budget.monthlyLimit,
          items: budget.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category
          }))
        });
        setTemplates((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setTemplateName('');
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to save template.'));
      }
    });
  };

  const onCreateBudget = () => {
    setNotice(null);
    startTransition(async () => {
      try {
        await createBudget({ name: `Budget ${savedBudgets.length + 1}`, monthlyLimit: totalBudget > 0 ? totalBudget : 100 });
        syncBudget();
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Could not create budget.'));
      }
    });
  };

  const onQuickAddOffer = (offer: Offer) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await addBudgetItem({ name: offer.name, quantity: 1, price: offer.price }, budget?.id);
        setBudget(next);
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to add offer item.'));
      }
    });
  };

  const onSelectSavedBudget = (id: string) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await getBudgetById(id);
        setBudget(next);
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Could not load selected budget.'));
      }
    });
  };

  const onApplyTemplate = (templateId: string) => {
    setNotice(null);
    startTransition(async () => {
      try {
        const next = await applyBudgetTemplate(templateId, budget?.id);
        setBudget(next);
        syncBudget();
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to apply template.'));
      }
    });
  };

  const beginBudgetEdit = (item: BudgetSummary, event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.stopPropagation();
    setEditingBudgetId(item.id);
    setEditingBudgetAmount(String(item.monthlyLimit || ''));
  };

  const cancelBudgetEdit = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingBudgetId(null);
    setEditingBudgetAmount('');
  };

  const saveBudgetEdit = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const nextAmount = Number.parseFloat(editingBudgetAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setNotice('Enter a valid budget amount.');
      return;
    }
    setNotice(null);
    startTransition(async () => {
      try {
        const updated = await updateBudget(id, { monthlyLimit: nextAmount });
        setSavedBudgets((current) => current.map((item) => (item.id === id ? updated : item)));
        if (budget?.id === id) setBudget(updated);
        setEditingBudgetId(null);
        setEditingBudgetAmount('');
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to update budget.'));
      }
    });
  };

  const onDeleteBudget = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setNotice(null);
    startTransition(async () => {
      try {
        await deleteBudget(id);
        setSavedBudgets((current) => {
          const next = current.filter((item) => item.id !== id);
          if (budget?.id === id) {
            setBudget(next[0] ?? null);
          }
          return next;
        });
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to delete budget.'));
      }
    });
  };

  const beginTemplateEdit = (template: { id: string; name: string }, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingTemplateId(template.id);
    setEditingTemplateName(template.name);
  };

  const cancelTemplateEdit = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingTemplateId(null);
    setEditingTemplateName('');
  };

  const saveTemplateEdit = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const nextName = editingTemplateName.trim();
    if (!nextName) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const updated = await updateBudgetTemplate(id, { name: nextName });
        setTemplates((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        setEditingTemplateId(null);
        setEditingTemplateName('');
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to update template.'));
      }
    });
  };

  const onDeleteTemplate = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setNotice(null);
    startTransition(async () => {
      try {
        await deleteBudgetTemplate(id);
        setTemplates((current) => current.filter((item) => item.id !== id));
        if (editingTemplateId === id) {
          setEditingTemplateId(null);
          setEditingTemplateName('');
        }
      } catch (error) {
        setNotice(toActionErrorMessage(error, 'Unable to delete template.'));
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
            {templates.length ? (
              <div className="mt-3 space-y-2">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="bf-saved-item">
                    <div className="top">
                      {editingTemplateId === template.id ? (
                        <input
                          value={editingTemplateName}
                          onChange={(event) => setEditingTemplateName(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                        />
                      ) : (
                        <strong>{template.name}</strong>
                      )}
                      <span>{formatCurrency(template.monthlyLimit)}</span>
                    </div>
                    <p>
                      {template.itemCount} item{template.itemCount === 1 ? '' : 's'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="bf-budget-btn is-dark is-sm"
                        onClick={() => onApplyTemplate(template.id)}
                        disabled={isPending}
                      >
                        Apply template
                      </button>
                      {editingTemplateId === template.id ? (
                        <>
                          <button
                            type="button"
                            className="bf-budget-btn is-green is-sm"
                            onClick={(event) => saveTemplateEdit(template.id, event)}
                            disabled={isPending}
                            aria-label={`Save ${template.name}`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="bf-budget-btn is-amber is-sm"
                            onClick={cancelTemplateEdit}
                            disabled={isPending}
                            aria-label={`Cancel editing ${template.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="bf-budget-btn is-amber is-sm"
                            onClick={(event) => beginTemplateEdit(template, event)}
                            disabled={isPending}
                            aria-label={`Edit ${template.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="bf-budget-btn is-amber is-sm"
                            onClick={(event) => onDeleteTemplate(template.id, event)}
                            disabled={isPending}
                            aria-label={`Delete ${template.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
                <div
                  key={item.id}
                  className={`bf-saved-item ${budget?.id === item.id ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSavedBudget(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectSavedBudget(item.id);
                    }
                  }}
                >
                  <div className="top">
                    {editingBudgetId === item.id ? (
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={editingBudgetAmount}
                        onChange={(event) => setEditingBudgetAmount(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                        aria-label="Budget amount"
                      />
                    ) : (
                      <strong>Budget {formatCurrency(item.monthlyLimit)}</strong>
                    )}
                    <span>{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <p>
                    Spent <span className="spent">{formatCurrency(item.spent)}</span> - Remaining{' '}
                    <span className="remaining">{formatCurrency(item.remaining)}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editingBudgetId === item.id ? (
                      <>
                        <button
                          type="button"
                          className="bf-budget-btn is-green is-sm"
                          onClick={(event) => saveBudgetEdit(item.id, event)}
                          disabled={isPending}
                          aria-label="Save budget"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="bf-budget-btn is-amber is-sm"
                          onClick={cancelBudgetEdit}
                          disabled={isPending}
                          aria-label="Cancel budget edit"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="bf-budget-btn is-amber is-sm"
                          onClick={(event) => beginBudgetEdit(item, event)}
                          disabled={isPending}
                          aria-label="Edit budget"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="bf-budget-btn is-amber is-sm"
                          onClick={(event) => onDeleteBudget(item.id, event)}
                          disabled={isPending}
                          aria-label="Delete budget"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
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
