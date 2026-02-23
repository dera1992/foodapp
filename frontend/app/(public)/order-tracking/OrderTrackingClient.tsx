'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OrderStatus, TrackingResult, TrackingState } from '@/types/tracking';
import styles from './OrderTrackingClient.module.css';

const DEMO_CHIPS = [
  { ref: 'BF-2026-001042', label: '🚚 Out for delivery' },
  { ref: 'BF-2026-001038', label: '✅ Delivered' },
  { ref: 'BF-2026-001035', label: '⚙️ Processing' },
  { ref: 'BF-2026-001030', label: '📋 Order placed' },
  { ref: 'BF-2026-001010', label: '❌ Cancelled' }
] as const;

const STEP_META = [
  { key: 'placed', icon: '📋', label: 'Order Placed' },
  { key: 'processing', icon: '⚙️', label: 'Processing' },
  { key: 'out_for_delivery', icon: '🚚', label: 'Out for Delivery' },
  { key: 'delivered', icon: '🏠', label: 'Delivered' }
] as const;

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed 📋',
  processing: 'Processing ⚙️',
  out_for_delivery: 'Out for Delivery 🚚',
  delivered: 'Delivered ✅',
  cancelled: 'Cancelled ✕'
};

function makeDemoResult(referenceCode: string, status: OrderStatus): TrackingResult {
  const baseItems = [
    { id: '1', name: 'Organic Whole Milk', emoji: '🥛', quantity: 2, price: 2.0 },
    { id: '2', name: 'Sourdough Loaf', emoji: '🍞', quantity: 1, price: 3.5 },
    { id: '3', name: 'Mixed Salad Bag', emoji: '🥗', quantity: 3, price: 1.5 },
    { id: '4', name: 'Mature Cheddar 300g', emoji: '🧀', quantity: 1, price: 3.2 }
  ];
  const total = baseItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const stepsByStatus: Record<OrderStatus, Array<{ timestamp: string | null; state: 'done' | 'active' | 'pending' }>> = {
    placed: [
      { timestamp: '22 Feb, 10:15', state: 'active' },
      { timestamp: null, state: 'pending' },
      { timestamp: null, state: 'pending' },
      { timestamp: null, state: 'pending' }
    ],
    processing: [
      { timestamp: '22 Feb, 10:15', state: 'done' },
      { timestamp: '22 Feb, 10:30', state: 'active' },
      { timestamp: null, state: 'pending' },
      { timestamp: null, state: 'pending' }
    ],
    out_for_delivery: [
      { timestamp: '22 Feb, 10:15', state: 'done' },
      { timestamp: '22 Feb, 10:30', state: 'done' },
      { timestamp: '22 Feb, 2:45', state: 'active' },
      { timestamp: null, state: 'pending' }
    ],
    delivered: [
      { timestamp: '20 Feb, 9:00', state: 'done' },
      { timestamp: '20 Feb, 9:20', state: 'done' },
      { timestamp: '20 Feb, 1:10', state: 'done' },
      { timestamp: '20 Feb, 2:05', state: 'done' }
    ],
    cancelled: [
      { timestamp: '18 Feb, 8:00', state: 'done' },
      { timestamp: null, state: 'pending' },
      { timestamp: null, state: 'pending' },
      { timestamp: null, state: 'pending' }
    ]
  };

  return {
    referenceCode,
    status,
    estimatedArrival:
      status === 'out_for_delivery' ? 'Today, 3:00-4:00 PM' : status === 'delivered' ? 'Delivered' : null,
    orderDate: '2026-02-22T10:15:00Z',
    total,
    deliveryAddress: '14 Oak Lane, Manchester, M1 2AB',
    etaMinutes: status === 'out_for_delivery' ? 45 : null,
    items: baseItems,
    dispatcher:
      status === 'out_for_delivery' || status === 'delivered'
        ? { name: 'Marcus T.', emoji: '🚴', rating: 4.9, phone: '+447700000000' }
        : null,
    steps: STEP_META.map((step, index) => ({
      icon: step.icon,
      label: step.label,
      timestamp: stepsByStatus[status][index]?.timestamp ?? null,
      state: stepsByStatus[status][index]?.state ?? 'pending'
    }))
  };
}

const DEMO_MAP: Record<string, TrackingResult> = {
  'BF-2026-001042': makeDemoResult('BF-2026-001042', 'out_for_delivery'),
  'BF-2026-001038': makeDemoResult('BF-2026-001038', 'delivered'),
  'BF-2026-001035': makeDemoResult('BF-2026-001035', 'processing'),
  'BF-2026-001030': makeDemoResult('BF-2026-001030', 'placed'),
  'BF-2026-001010': makeDemoResult('BF-2026-001010', 'cancelled')
};

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OrderTrackingClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<TrackingState>({
    query: searchParams.get('ref') ?? '',
    result: null,
    loading: false,
    notFound: false,
    error: null
  });
  const autoTrackedRef = useRef<string | null>(null);

  const handleTrack = async (refInput: string) => {
    const clean = refInput.trim().toUpperCase();
    if (!clean) return;

    setState((s) => ({
      ...s,
      query: clean,
      loading: true,
      notFound: false,
      error: null,
      result: null
    }));

    try {
      const res = await fetch(`/api/orders/track/?ref=${encodeURIComponent(clean)}`, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.status === 404) {
        if (process.env.NODE_ENV === 'development' && DEMO_MAP[clean]) {
          const result = DEMO_MAP[clean];
          setState((s) => ({ ...s, loading: false, result, notFound: false, error: null }));
          window.history.replaceState({}, '', `/order-tracking?ref=${clean}`);
          return;
        }
        setState((s) => ({ ...s, loading: false, notFound: true }));
        return;
      }

      if (!res.ok) throw new Error('Server error');

      const data = (await res.json()) as TrackingResult;
      setState((s) => ({ ...s, loading: false, result: data }));
      window.history.replaceState({}, '', `/order-tracking?ref=${clean}`);
    } catch {
      if (process.env.NODE_ENV === 'development' && DEMO_MAP[clean]) {
        const result = DEMO_MAP[clean];
        setState((s) => ({ ...s, loading: false, result, error: null, notFound: false }));
        window.history.replaceState({}, '', `/order-tracking?ref=${clean}`);
        return;
      }
      setState((s) => ({ ...s, loading: false, error: 'Something went wrong.' }));
    }
  };

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (!ref) return;
    const clean = ref.trim().toUpperCase();
    if (!clean || autoTrackedRef.current === clean) return;
    autoTrackedRef.current = clean;
    void handleTrack(clean);
  }, [searchParams]);

  const result = state.result;
  const showEta = Boolean(result && result.status === 'out_for_delivery' && result.etaMinutes !== null);
  const showDispatcher = Boolean(result?.dispatcher && (result.status === 'out_for_delivery' || result.status === 'delivered'));
  const showCancelled = result?.status === 'cancelled';
  const staticDot = result ? ['delivered', 'cancelled'].includes(result.status) : false;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <section className={styles.hero}>
          <div className={styles.heroBadge}>📦 Order Tracking</div>
          <h1 className={styles.heroTitle}>Track your order</h1>
          <p className={styles.heroSub}>Enter your order reference to see the latest delivery status.</p>
        </section>

        <section className={styles.searchCard}>
          <label className={styles.fieldLabel} htmlFor="tracking-ref">Reference Code</label>
          <div className={styles.inputRow}>
            <input
              id="tracking-ref"
              type="text"
              className={styles.refInput}
              value={state.query}
              onChange={(e) => setState((s) => ({ ...s, query: e.target.value, notFound: false, error: null }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleTrack(state.query);
              }}
              placeholder="e.g. BF-2026-001042"
            />
            <button
              type="button"
              className={styles.trackBtn}
              onClick={() => void handleTrack(state.query)}
              disabled={!state.query.trim() || state.loading}
            >
              {state.loading ? <span className={styles.spinner}>⟳</span> : <SearchGlyph />}
              {state.loading ? 'Searching...' : 'Track order'}
            </button>
          </div>
          <p className={styles.fieldHint}>
            Your reference code is in your confirmation email. <Link href="/account/orders/">View my orders →</Link>
          </p>

          {state.notFound ? (
            <div className={styles.errorBox}>❌ Order not found. Please check your reference and try again.</div>
          ) : null}
          {state.error ? (
            <div className={styles.errorBox}>⚠️ Something went wrong. Please try again.</div>
          ) : null}
        </section>

        {process.env.NODE_ENV === 'development' ? (
          <div className={styles.demoRow}>
            {DEMO_CHIPS.map((demo) => (
              <button
                key={demo.ref}
                type="button"
                className={styles.demoChip}
                onClick={() => {
                  setState((s) => ({ ...s, query: demo.ref }));
                  void handleTrack(demo.ref);
                }}
              >
                {demo.label}
              </button>
            ))}
          </div>
        ) : null}

        {result ? (
          <section className={styles.resultCard}>
            <div className={styles.rcHeader}>
              <div className={styles.refMeta}>
                <div className={styles.refLabel}>Order Reference</div>
                <p className={styles.refValue}>{result.referenceCode}</p>
              </div>
              <div className={styles.statusPill}>
                <span className={`${styles.statusDot} ${staticDot ? styles.statusDotStatic : styles.statusDotPulse}`} />
                <span>{STATUS_LABELS[result.status]}</span>
              </div>
            </div>

            <div className={styles.stepperSection}>
              <div className={styles.stepper}>
                {result.steps.map((step, index) => {
                  const prevDone = index > 0 && result.steps[index - 1]?.state === 'done';
                  const circleStateClass =
                    step.state === 'done'
                      ? styles.stepDone
                      : step.state === 'active'
                        ? styles.stepActive
                        : styles.stepPending;
                  const labelStateClass = step.state === 'pending' ? '' : styles.stepLabelStrong;

                  return (
                    <div className={styles.step} key={`${step.label}-${index}`}>
                      {index > 0 ? (
                        <div className={`${styles.stepConnector} ${prevDone ? styles.stepConnectorDone : ''}`} aria-hidden="true" />
                      ) : null}
                      <div className={`${styles.stepCircle} ${circleStateClass}`}>{step.icon}</div>
                      <div className={`${styles.stepLabel} ${labelStateClass}`}>{step.label}</div>
                      <div className={styles.stepTime}>{step.timestamp ?? '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.detailsSection}>
              <div className={styles.detailGrid}>
                <div className={styles.detailPill}>
                  <div className={styles.detailLabel}>Estimated Arrival</div>
                  <div className={styles.detailValue}>{result.estimatedArrival ?? 'TBC'}</div>
                </div>
                <div className={styles.detailPill}>
                  <div className={styles.detailLabel}>Delivery Address</div>
                  <div className={styles.detailValue}>{result.deliveryAddress}</div>
                </div>
                <div className={styles.detailPill}>
                  <div className={styles.detailLabel}>Order Date</div>
                  <div className={styles.detailValue}>{formatDateLabel(result.orderDate)}</div>
                </div>
                <div className={styles.detailPill}>
                  <div className={styles.detailLabel}>Order Total</div>
                  <div className={`${styles.detailValue} ${styles.detailValueGreen}`}>£{result.total.toFixed(2)}</div>
                </div>
              </div>

              {showEta ? (
                <div className={styles.etaBar}>
                  🚚 Your order is on the way - arriving in approximately <strong>{result.etaMinutes} mins</strong>
                </div>
              ) : null}
            </div>

            <div className={styles.itemsSection}>
              <div className={styles.itemsTitle}>Items in this order</div>
              {result.items.map((item) => (
                <div className={styles.itemRow} key={item.id}>
                  <div className={styles.itemEmoji}>{item.emoji}</div>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemQty}>×{item.quantity}</div>
                  <div className={styles.itemPrice}>£{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {showDispatcher && result.dispatcher ? (
              <div className={styles.dispatcher}>
                <div className={styles.dispatcherAvatar}>{result.dispatcher.emoji}</div>
                <div>
                  <div className={styles.dispatcherName}>{result.dispatcher.name}</div>
                  <div className={styles.dispatcherSub}>Your dispatcher · ⭐ {result.dispatcher.rating}</div>
                </div>
                <a href={`tel:${result.dispatcher.phone}`} className={styles.callBtn}>📞 Call</a>
              </div>
            ) : null}

            {showCancelled ? (
              <div className={styles.cancelledBanner}>
                ❌ This order was cancelled. If you were charged, a refund will appear within 3-5 business days.
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

