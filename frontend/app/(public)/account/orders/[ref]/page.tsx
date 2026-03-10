import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, MapPin, Package, Truck } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getOrderDetail } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';

function StatusStep({ label, done, detail }: { label: string; done: boolean; detail?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
          <CheckCircle className="h-4 w-4" />
        </div>
        <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="pb-6">
        <p className={`text-sm font-semibold ${done ? 'text-brand-primary' : 'text-slate-400'}`}>{label}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await getSession();

  if (!session.isAuthenticated) redirect('/login');

  let order: Record<string, unknown> | null = null;
  try {
    order = await getOrderDetail(ref);
  } catch {
    // handled below
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Order not found</p>
          <Link href="/account/orders" className="mt-4 inline-block text-brand-primary text-sm hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const status = String(order.status ?? 'Order placed');
  const total = typeof order.total === 'number' ? order.total : 0;
  const paid = Boolean(order.paid || order.verified);
  const itemsDetail = Array.isArray(order.items_detail) ? order.items_detail : [];
  const deliveryAddress = String(order.delivery_address_text ?? '');
  const deliveryDate = order.delivery_date ? String(order.delivery_date) : null;
  const deliverySlot = order.delivery_slot ? String(order.delivery_slot) : null;
  const contactName = String(order.contact_name ?? '');
  const contactPhone = String(order.contact_phone ?? '');
  const contactEmail = String(order.contact_email ?? '');
  const createdAt = order.created ? new Date(String(order.created)).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const paymentMethod = String(order.payment_method ?? '');
  const couponCode = order.coupon ? String(order.coupon) : null;

  const steps = [
    { label: 'Order placed', done: true, detail: createdAt },
    { label: 'Payment confirmed', done: paid, detail: paid ? 'Your payment was received.' : undefined },
    { label: 'Preparing order', done: Boolean(order.is_ordered), detail: 'We are packing your items.' },
    { label: 'Out for delivery', done: Boolean(order.being_delivered), detail: undefined },
    { label: 'Delivered', done: Boolean(order.received), detail: undefined },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to my orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order details</h1>
          <p className="mt-1 text-sm text-slate-500">Ref: <span className="font-mono font-semibold text-slate-700">{ref}</span></p>
        </div>
        <span className={`self-start inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold
          ${status.toLowerCase().includes('deliver') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
            paid ? 'border-amber-200 bg-amber-50 text-amber-700' :
            'border-blue-200 bg-blue-50 text-blue-700'}`}>
          {status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: items + totals */}
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-primary" />
              Items ordered
            </h2>
            <div className="divide-y divide-slate-100">
              {itemsDetail.length ? itemsDetail.map((item, i) => {
                const it = item as Record<string, unknown>;
                return (
                  <div key={i} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{String(it.item_title ?? '')}</p>
                      <p className="text-xs text-slate-500">Qty: {String(it.quantity ?? 1)}</p>
                    </div>
                    <p className="font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(typeof it.line_total === 'number' ? it.line_total : 0)}
                    </p>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-500 py-2">No item details available.</p>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
              {couponCode && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promo ({couponCode})</span>
                  <span>Applied</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1">
                <span>Total paid</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Payment method</span>
                <span className="capitalize">{paymentMethod || '—'}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          {(deliveryAddress || deliveryDate) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-primary" />
                Delivery details
              </h2>
              <div className="space-y-2 text-sm text-slate-700">
                {deliveryAddress && <p>{deliveryAddress}</p>}
                {deliveryDate && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {deliveryDate}{deliverySlot ? ` · ${deliverySlot}` : ''}
                  </p>
                )}
                {(contactName || contactPhone || contactEmail) && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {contactName && <p className="font-medium">{contactName}</p>}
                    {contactPhone && <p>{contactPhone}</p>}
                    {contactEmail && <p>{contactEmail}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: tracking timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-primary" />
            Order tracking
          </h2>
          <div>
            {steps.map((step, i) => (
              <StatusStep key={i} label={step.label} done={step.done} detail={step.detail} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
