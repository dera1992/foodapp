import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, MapPin, Package, Phone, Truck, User } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getOrderDetail } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';

function Step({ label, done, detail }: { label: string; done: boolean; detail?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
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

export default async function ShopOrderDetailPage({ params }: { params: Promise<{ ref: string }> }) {
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
          <Link href="/admin/orders" className="mt-4 inline-block text-brand-primary text-sm hover:underline">
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
  const paymentMethod = String(order.payment_method ?? '');
  const paymentRef = String(order.payment_reference ?? '');
  const createdAt = order.created ? new Date(String(order.created)).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const steps = [
    { label: 'Order placed', done: true, detail: createdAt },
    { label: 'Payment confirmed', done: paid, detail: paid ? `Via ${paymentMethod}` : undefined },
    { label: 'Preparing order', done: Boolean(order.is_ordered), detail: undefined },
    { label: 'Out for delivery', done: Boolean(order.being_delivered), detail: undefined },
    { label: 'Delivered', done: Boolean(order.received), detail: undefined },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order {ref.slice(0, 10)}…</h1>
          <p className="mt-1 text-sm text-slate-500 font-mono">{ref}</p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <span className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold
            ${status.toLowerCase().includes('deliver') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
              paid ? 'border-amber-200 bg-amber-50 text-amber-700' :
              'border-blue-200 bg-blue-50 text-blue-700'}`}>
            {status}
          </span>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
            {paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-primary" />
              Customer
            </h2>
            <div className="space-y-1.5 text-sm text-slate-700">
              {contactName && <p className="font-medium">{contactName}</p>}
              {contactEmail && <p>{contactEmail}</p>}
              {contactPhone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {contactPhone}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-primary" />
              Items
            </h2>
            <div className="divide-y divide-slate-100">
              {itemsDetail.length ? itemsDetail.map((item, i) => {
                const it = item as Record<string, unknown>;
                return (
                  <div key={i} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{String(it.item_title ?? '')}</p>
                      <p className="text-xs text-slate-500">Qty: {String(it.quantity ?? 1)} · Unit price: {formatCurrency(typeof it.item_price === 'number' ? it.item_price : 0)}</p>
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

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1">
                <span>Order total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Payment</span>
                <span className="capitalize">{paymentMethod || '—'}</span>
              </div>
              {paymentRef && (
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Payment ref</span>
                  <span className="font-mono truncate max-w-[140px]">{paymentRef}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          {(deliveryAddress || deliveryDate) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-primary" />
                Delivery
              </h2>
              <div className="space-y-1.5 text-sm text-slate-700">
                {deliveryAddress && <p>{deliveryAddress}</p>}
                {deliveryDate && <p className="text-slate-500">{deliveryDate}{deliverySlot ? ` · ${deliverySlot}` : ''}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Tracking */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-primary" />
            Status timeline
          </h2>
          <div>
            {steps.map((step, i) => (
              <Step key={i} label={step.label} done={step.done} detail={step.detail} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
