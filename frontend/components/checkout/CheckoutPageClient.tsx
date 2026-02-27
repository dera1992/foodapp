'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, Clock3, CreditCard, Home, Lock, MapPin, Store, Truck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/money';
import type { Cart } from '@/types/api';
import type { CheckoutSavedAddress, CheckoutTimeSlot } from '@/lib/api/endpoints';
import { getCheckoutTimeSlots, placeCheckoutOrder, validateCheckoutPromo } from '@/lib/api/endpoints';
import styles from './CheckoutPageClient.module.css';

type Props = { initialCart: Cart; savedAddresses: CheckoutSavedAddress[]; initialTimeSlots: CheckoutTimeSlot[] };
type DeliveryMode = 'delivery' | 'pickup' | 'mixed';
type ShopMode = 'delivery' | 'pickup';
type PaymentMethod = 'card' | 'transfer' | 'cash';

type ShopGroup = { shopId: string; shopName: string; items: Cart['items']; subtotal: number };

type FormState = {
  deliveryMode: DeliveryMode;
  shopModes: Record<string, ShopMode>;
  deliveryDate: string;
  deliverySlot: string;
  address: { line1: string; line2: string; city: string; county: string; postcode: string; notes: string; saveAddress: boolean };
  contact: { firstName: string; lastName: string; email: string; phone: string; saveContact: boolean };
  payment: { method: PaymentMethod; cardNumber: string; cardName: string; cardExpiry: string; cardCvv: string };
  promoCode: string;
  promoApplied: boolean;
  promoDiscount: number;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toErrorMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : fallback;
}

function groupByShop(cart: Cart): ShopGroup[] {
  const map = new Map<string, ShopGroup>();
  for (const item of cart.items) {
    const shopId = item.shopId || `shop-${item.shopName || 'unknown'}`;
    const shopName = item.shopName || 'Local shop';
    const row = map.get(shopId);
    if (row) {
      row.items.push(item);
      row.subtotal += item.lineTotal;
    } else {
      map.set(shopId, { shopId, shopName, items: [item], subtotal: item.lineTotal });
    }
  }
  return [...map.values()];
}

function splitShipping(total: number, groups: ShopGroup[], mode: DeliveryMode, shopModes: Record<string, ShopMode>) {
  const eligible = groups.filter((g) => (mode === 'delivery' ? true : mode === 'pickup' ? false : (shopModes[g.shopId] ?? 'delivery') === 'delivery'));
  if (!eligible.length || total <= 0) return {} as Record<string, number>;
  const each = total / eligible.length;
  return Object.fromEntries(eligible.map((g) => [g.shopId, each])) as Record<string, number>;
}

export function CheckoutPageClient({ initialCart, savedAddresses, initialTimeSlots }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState(initialTimeSlots);
  const [slotLoading, setSlotLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups = useMemo(() => groupByShop(initialCart), [initialCart]);
  const defaultShopModes = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.shopId, 'delivery'])) as Record<string, ShopMode>,
    [groups]
  );

  const [form, setForm] = useState<FormState>({
    deliveryMode: 'delivery',
    shopModes: defaultShopModes,
    deliveryDate: todayIso(),
    deliverySlot: initialTimeSlots.find((s) => s.available > 0)?.id ?? '',
    address: { line1: '', line2: '', city: '', county: '', postcode: '', notes: '', saveAddress: true },
    contact: { firstName: '', lastName: '', email: '', phone: '', saveContact: true },
    payment: { method: 'card', cardNumber: '', cardName: '', cardExpiry: '', cardCvv: '' },
    promoCode: '',
    promoApplied: false,
    promoDiscount: 0
  });

  useEffect(() => {
    let cancelled = false;
    setSlotLoading(true);
    getCheckoutTimeSlots(form.deliveryDate)
      .then((next) => {
        if (cancelled) return;
        setSlots(next);
        if (!next.some((s) => s.id === form.deliverySlot && s.available > 0)) {
          setForm((prev) => ({ ...prev, deliverySlot: next.find((s) => s.available > 0)?.id ?? '' }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSlotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.deliveryDate]);

  const effectiveMode = (shopId: string): ShopMode =>
    form.deliveryMode === 'mixed' ? (form.shopModes[shopId] ?? 'delivery') : form.deliveryMode === 'pickup' ? 'pickup' : 'delivery';

  const shippingByShop = useMemo(
    () => splitShipping(initialCart.shipping || 0, groups, form.deliveryMode, form.shopModes),
    [initialCart.shipping, groups, form.deliveryMode, form.shopModes]
  );
  const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const deliveryTotal = Object.values(shippingByShop).reduce((sum, n) => sum + n, 0);
  const grandTotal = Math.max(0, subtotal + deliveryTotal - (form.promoApplied ? form.promoDiscount : 0));
  const itemCount = initialCart.items.reduce((sum, item) => sum + item.quantity, 0);
  const savings = initialCart.items.reduce((sum, item) => sum + (item.savings ?? 0), 0);

  const setShopMode = (shopId: string, mode: ShopMode) => setForm((p) => ({ ...p, shopModes: { ...p.shopModes, [shopId]: mode } }));

  const lookupPostcode = async () => {
    if (!form.address.postcode.trim()) return;
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(form.address.postcode.replace(/\s+/g, ''))}`);
      const data = (await res.json()) as { status?: number; result?: Record<string, unknown> };
      if (data.status !== 200 || !data.result) throw new Error();
      setForm((p) => ({
        ...p,
        address: {
          ...p.address,
          city: String(data.result?.admin_district ?? data.result?.parish ?? p.address.city ?? ''),
          county: String(data.result?.region ?? data.result?.admin_county ?? p.address.county ?? '')
        }
      }));
      toast.success('Postcode details found.');
    } catch {
      toast.error('Postcode lookup failed.');
    }
  };

  const onApplyPromo = async () => {
    const code = form.promoCode.trim().toUpperCase();
    if (!code) return;
    try {
      const result = await validateCheckoutPromo(code, subtotal);
      if (!result.valid) {
        toast.error(result.message || 'Invalid promo code.');
        setForm((p) => ({ ...p, promoCode: code, promoApplied: false, promoDiscount: 0 }));
        return;
      }
      setForm((p) => ({ ...p, promoCode: code, promoApplied: true, promoDiscount: result.discount }));
      toast.success(`${code} applied`);
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not validate promo.'));
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.deliveryMode !== 'pickup') {
      if (!form.address.line1.trim()) next.addressLine1 = 'Address line 1 is required';
      if (!form.address.city.trim()) next.addressCity = 'City is required';
      if (!form.address.postcode.trim()) next.addressPostcode = 'Postcode is required';
      if (!form.deliverySlot) next.deliverySlot = 'Choose a delivery slot';
    }
    if (!form.contact.email.trim()) next.contactEmail = 'Email is required';
    if (!form.contact.phone.trim()) next.contactPhone = 'Phone is required';
    if (form.payment.method === 'card') {
      if (!form.payment.cardNumber.trim()) next.cardNumber = 'Card number is required';
      if (!form.payment.cardExpiry.trim()) next.cardExpiry = 'Card expiry is required';
      if (!form.payment.cardCvv.trim()) next.cardCvv = 'CVV is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPlaceOrder = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const result = await placeCheckoutOrder({
          deliveryMode: form.deliveryMode,
          shopModes: form.shopModes,
          deliveryDate: form.deliveryMode === 'pickup' ? undefined : form.deliveryDate,
          deliverySlot: form.deliveryMode === 'pickup' ? undefined : form.deliverySlot,
          address: form.deliveryMode === 'pickup' ? undefined : form.address,
          contact: form.contact,
          payment: form.payment,
          promoCode: form.promoApplied ? form.promoCode : undefined
        });
        if (!result.success) throw new Error(result.error || 'Unable to place order');
        toast.success('Order placed');
        const ids = result.orderIds.join(',');
        router.push(ids ? `/order/confirmation?orders=${encodeURIComponent(ids)}` : '/account/orders');
      } catch (error) {
        toast.error(toErrorMessage(error, 'Could not place order.'));
      }
    });
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.texture} aria-hidden />
      <div className={styles.page}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

        <div className={styles.steps}>
          {['Cart', 'Checkout', 'Confirmation'].map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <div className={cn(styles.stepDot, i === 0 && styles.stepDone, i === 1 && styles.stepActive)}>{i === 0 ? '✓' : i + 1}</div>
              <span className={cn(styles.stepText, i === 1 && styles.stepTextActive)}>{label}</span>
              {i < 2 ? <div className={cn(styles.stepLine, i === 0 && styles.stepLineDone)} /> : null}
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <section className={styles.card}>
              <h2 className={styles.title}><span className={styles.titleBadge}>1</span> Delivery <em>mode</em></h2>
              <div className={styles.modeGrid}>
                {[
                  { id: 'delivery' as const, label: 'Delivery', desc: 'Delivered to your door', icon: Truck },
                  { id: 'pickup' as const, label: 'Pickup', desc: 'Collect from shop', icon: Store },
                  { id: 'mixed' as const, label: 'Mixed', desc: 'Set per shop', icon: ChevronRight }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} type="button" className={cn(styles.modeBtn, form.deliveryMode === m.id && styles.modeBtnActive)} onClick={() => setForm((p) => ({ ...p, deliveryMode: m.id }))}>
                      <Icon className={styles.modeIcon} />
                      <span>{m.label}</span>
                      <small>{m.desc}</small>
                    </button>
                  );
                })}
              </div>
              {form.deliveryMode === 'mixed' ? (
                <div className={styles.shopModes}>
                  {groups.map((g) => (
                    <div key={g.shopId} className={styles.shopModeRow}>
                      <span><Store className="h-3.5 w-3.5" /> {g.shopName}</span>
                      <div>
                        <button type="button" className={cn(styles.smallPill, effectiveMode(g.shopId) === 'delivery' && styles.smallPillActive)} onClick={() => setShopMode(g.shopId, 'delivery')}>Delivery</button>
                        <button type="button" className={cn(styles.smallPill, effectiveMode(g.shopId) === 'pickup' && styles.smallPillActive)} onClick={() => setShopMode(g.shopId, 'pickup')}>Pickup</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {form.deliveryMode !== 'pickup' ? (
              <>
                <section className={styles.card}>
                  <h2 className={styles.title}><span className={styles.titleBadge}>2</span> Delivery <em>window</em></h2>
                  <div className={styles.row2}>
                    <label className={styles.field}><span>Date</span><input type="date" className={styles.input} min={todayIso()} value={form.deliveryDate} onChange={(e) => setForm((p) => ({ ...p, deliveryDate: e.target.value }))} /></label>
                    <label className={styles.field}><span>Earliest time</span><select className={styles.input} defaultValue="asap"><option value="asap">As soon as possible</option><option value="12">After 12:00</option><option value="14">After 14:00</option><option value="18">After 18:00</option></select></label>
                  </div>
                  <div className={styles.slotHead}><span>Available slots</span><small>{slotLoading ? 'Refreshing…' : ''}</small></div>
                  <div className={styles.slotGrid}>
                    {slots.map((slot) => (
                      <button key={slot.id} type="button" disabled={slot.available <= 0} className={cn(styles.slotBtn, form.deliverySlot === slot.id && styles.slotBtnActive, slot.available <= 0 && styles.slotBtnDisabled)} onClick={() => setForm((p) => ({ ...p, deliverySlot: slot.id }))}>
                        <strong>{slot.label}</strong>
                        <small>{slot.available <= 0 ? 'Full' : `${slot.available} left`}</small>
                      </button>
                    ))}
                    {!slots.length ? <div className={styles.emptyHint}>No slots returned yet.</div> : null}
                  </div>
                  {errors.deliverySlot ? <p className={styles.error}>{errors.deliverySlot}</p> : null}
                </section>

                <section className={styles.card}>
                  <h2 className={styles.title}><span className={styles.titleBadge}>3</span> Delivery <em>address</em></h2>
                  {savedAddresses.length ? (
                    <div className={styles.savedList}>
                      {savedAddresses.map((a) => (
                        <button key={a.id} type="button" className={styles.savedAddr} onClick={() => setForm((p) => ({ ...p, address: { ...p.address, line1: a.line1, line2: a.line2, city: a.city, county: a.county, postcode: a.postcode } }))}>
                          <Home className="h-4 w-4" />
                          <span><strong>{a.label}</strong><small>{a.line1}, {a.city}, {a.postcode}</small></span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.rowPostcode}>
                    <label className={styles.field}><span>Postcode</span><input className={cn(styles.input, errors.addressPostcode && styles.inputError)} value={form.address.postcode} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, postcode: e.target.value.toUpperCase() } }))} /></label>
                    <button type="button" className={styles.ghostBtn} onClick={lookupPostcode}>Find address</button>
                  </div>
                  {errors.addressPostcode ? <p className={styles.error}>{errors.addressPostcode}</p> : null}
                  <div className={styles.row1}><label className={styles.field}><span>Address line 1</span><input className={cn(styles.input, errors.addressLine1 && styles.inputError)} value={form.address.line1} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, line1: e.target.value } }))} /></label></div>
                  {errors.addressLine1 ? <p className={styles.error}>{errors.addressLine1}</p> : null}
                  <div className={styles.row1}><label className={styles.field}><span>Address line 2 (optional)</span><input className={styles.input} value={form.address.line2} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, line2: e.target.value } }))} /></label></div>
                  <div className={styles.row2}>
                    <label className={styles.field}><span>City / Town</span><input className={cn(styles.input, errors.addressCity && styles.inputError)} value={form.address.city} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))} /></label>
                    <label className={styles.field}><span>County</span><input className={styles.input} value={form.address.county} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, county: e.target.value } }))} /></label>
                  </div>
                  {errors.addressCity ? <p className={styles.error}>{errors.addressCity}</p> : null}
                  <div className={styles.row1}><label className={styles.field}><span>Delivery instructions (optional)</span><input className={styles.input} value={form.address.notes} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, notes: e.target.value } }))} /></label></div>
                </section>
              </>
            ) : null}

            <section className={styles.card}>
              <h2 className={styles.title}><span className={styles.titleBadge}>{form.deliveryMode === 'pickup' ? '2' : '4'}</span> Contact <em>details</em></h2>
              <div className={styles.row2}>
                <label className={styles.field}><span>First name</span><input className={styles.input} value={form.contact.firstName} onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, firstName: e.target.value } }))} /></label>
                <label className={styles.field}><span>Last name</span><input className={styles.input} value={form.contact.lastName} onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, lastName: e.target.value } }))} /></label>
              </div>
              <div className={styles.row2}>
                <label className={styles.field}><span>Email</span><input type="email" className={cn(styles.input, errors.contactEmail && styles.inputError)} value={form.contact.email} onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))} /></label>
                <label className={styles.field}><span>Phone</span><input className={cn(styles.input, errors.contactPhone && styles.inputError)} value={form.contact.phone} onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))} /></label>
              </div>
              {errors.contactEmail ? <p className={styles.error}>{errors.contactEmail}</p> : null}
              {errors.contactPhone ? <p className={styles.error}>{errors.contactPhone}</p> : null}
            </section>

            <section className={styles.card}>
              <h2 className={styles.title}><span className={styles.titleBadge}>{form.deliveryMode === 'pickup' ? '3' : '5'}</span> Payment <em>method</em></h2>
              <div className={styles.payList}>
                {[{ id: 'card' as const, label: 'Card Payment', icon: CreditCard }, { id: 'transfer' as const, label: 'Bank Transfer', icon: Building2 }, { id: 'cash' as const, label: 'Cash on Delivery', icon: Wallet }].map((m) => {
                  const Icon = m.icon;
                  const active = form.payment.method === m.id;
                  return (
                    <div key={m.id} className={cn(styles.payOption, active && styles.payOptionActive)}>
                      <button type="button" className={styles.payHead} onClick={() => setForm((p) => ({ ...p, payment: { ...p.payment, method: m.id } }))}>
                        <span className={cn(styles.payRadio, active && styles.payRadioActive)} />
                        <Icon className="h-4 w-4" />
                        <span className={styles.payLabel}>{m.label}</span>
                      </button>
                      {active && m.id === 'card' ? (
                        <div className={styles.payBody}>
                          <div className={styles.row1}><label className={styles.field}><span>Card number</span><input className={cn(styles.input, errors.cardNumber && styles.inputError)} value={form.payment.cardNumber} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() } }))} /></label></div>
                          <div className={styles.row1}><label className={styles.field}><span>Name on card</span><input className={styles.input} value={form.payment.cardName} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, cardName: e.target.value } }))} /></label></div>
                          <div className={styles.row2}>
                            <label className={styles.field}><span>Expiry</span><input className={cn(styles.input, errors.cardExpiry && styles.inputError)} value={form.payment.cardExpiry} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setForm((p) => ({ ...p, payment: { ...p.payment, cardExpiry: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d } })); }} /></label>
                            <label className={styles.field}><span>CVV</span><input className={cn(styles.input, errors.cardCvv && styles.inputError)} value={form.payment.cardCvv} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4) } }))} /></label>
                          </div>
                          {errors.cardNumber ? <p className={styles.error}>{errors.cardNumber}</p> : null}
                          {errors.cardExpiry ? <p className={styles.error}>{errors.cardExpiry}</p> : null}
                          {errors.cardCvv ? <p className={styles.error}>{errors.cardCvv}</p> : null}
                          <div className={styles.secureNote}><Lock className="h-3.5 w-3.5" /> Secured by SSL</div>
                        </div>
                      ) : active && m.id === 'transfer' ? (
                        <div className={styles.payBody}>
                          <div className={styles.bankGrid}>
                            <div><span>Account name</span><strong>Bunchfood Ltd</strong></div>
                            <div><span>Sort code</span><strong>20-45-67</strong></div>
                            <div><span>Account no.</span><strong>83712940</strong></div>
                            <div><span>Reference</span><strong>BF-CHECKOUT</strong></div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className={styles.right}>
            <section className={styles.summary}>
              <h2 className={styles.summaryTitle}>Your <span>Order</span><small>({groups.length} shop{groups.length === 1 ? '' : 's'})</small></h2>
              {groups.map((g, idx) => (
                <div key={g.shopId} className={cn(styles.shopSummary, idx > 0 && styles.shopSummaryDiv)}>
                  <div className={styles.shopSummaryHead}>
                    <span className={styles.shopName}><Store className="h-3.5 w-3.5" /> {g.shopName}</span>
                    <span className={styles.shopCount}>{g.items.length} item{g.items.length === 1 ? '' : 's'}</span>
                    <span className={styles.shopMode}>{effectiveMode(g.shopId)}</span>
                  </div>
                  {g.items.map((item) => {
                    const original = item.savings && item.quantity ? item.lineTotal + item.savings : 0;
                    return (
                      <div key={item.id ?? item.productId} className={styles.summaryItem}>
                        <div className={styles.summaryItemBody}><strong>{item.name}</strong><small>Qty: {item.quantity}</small></div>
                        <div className={styles.summaryItemPrice}><span>{formatCurrency(item.lineTotal)}</span>{original > item.lineTotal ? <small>{formatCurrency(original)}</small> : null}</div>
                      </div>
                    );
                  })}
                  <div className={styles.shopSub}><span>{g.shopName} subtotal</span><strong>{formatCurrency(g.subtotal)}</strong></div>
                </div>
              ))}

              <div className={styles.promo}>
                <input className={styles.promoInput} placeholder="Promo or voucher code" value={form.promoCode} onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value.toUpperCase(), promoApplied: false, promoDiscount: 0 }))} />
                <button type="button" className={styles.promoBtn} onClick={onApplyPromo} disabled={!form.promoCode.trim() || isPending}>Apply</button>
              </div>
              {form.promoApplied ? <p className={styles.promoOk}>{form.promoCode} applied - {formatCurrency(form.promoDiscount)} off</p> : null}
              {savings > 0 ? <div className={styles.savings}>You are saving <strong>{formatCurrency(savings)}</strong> on this order.</div> : null}

              <div className={styles.totalRows}>
                <div className={styles.totalRow}><span>Subtotal ({itemCount} items)</span><strong>{formatCurrency(subtotal)}</strong></div>
                {groups.map((g) => {
                  const fee = shippingByShop[g.shopId] ?? 0;
                  return <div key={`${g.shopId}-fee`} className={styles.totalRow}><span>{g.shopName} {effectiveMode(g.shopId)}</span><strong className={fee === 0 ? styles.free : ''}>{fee === 0 ? 'FREE' : formatCurrency(fee)}</strong></div>;
                })}
                {form.promoApplied ? <div className={styles.totalRow}><span>Promo ({form.promoCode})</span><strong className={styles.discount}>-{formatCurrency(form.promoDiscount)}</strong></div> : null}
                <div className={styles.grand}><span>Grand Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
              </div>

              <Button className={styles.placeBtn} onClick={onPlaceOrder} disabled={isPending}>
                <Lock className="h-4 w-4" />
                {isPending ? 'Processing…' : `Place Order — ${formatCurrency(grandTotal)}`}
              </Button>

              <p className={styles.terms}>By placing your order you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
              <div className={styles.trust}>
                <span><Lock className="h-3.5 w-3.5" /> Secure</span>
                <span><Clock3 className="h-3.5 w-3.5" /> Fast</span>
                <span><MapPin className="h-3.5 w-3.5" /> Local</span>
              </div>
              <div className={styles.links}>
                <Link href="/cart" className={styles.linkGhost}><ChevronRight className="h-4 w-4 rotate-180" /> Back to cart</Link>
                <Link href="/shops" className={styles.linkText}>Continue shopping <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

