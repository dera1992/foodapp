import type { Session } from '@/lib/auth/session';
import type { OrderStatusRow } from '@/components/orders/OrderStatusDashboardPage';

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function pickBool(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (['true', '1', 'yes', 'paid'].includes(normalized)) return true;
      if (['false', '0', 'no', 'unpaid'].includes(normalized)) return false;
    }
  }
  return undefined;
}

function pickNested(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return {};
}

function pickProductLabel(record: Record<string, unknown>): string {
  const direct = pickString(record, ['product_name', 'product', 'item_name']);
  if (direct) return direct;

  const items = record.items;
  if (Array.isArray(items) && items.length) {
    const first = items[0];
    if (typeof first === 'string') return first;
    const firstRec = toRecord(first);
    const firstName = pickString(firstRec, ['name', 'title', 'product_name']);
    const count = items.length;
    if (firstName) return count > 1 ? `${firstName} +${count - 1} more` : firstName;
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  return '';
}

function normalizeStatus(value: string): string {
  const v = value.toLowerCase().trim();
  if (!v) return 'order placed';
  if (v.includes('order placed')) return 'order placed';
  if (v.includes('placed')) return 'order placed';
  if (v.includes('process')) return 'in process';
  if (v.includes('pending')) return 'pending';
  if (v.includes('deliver')) return 'delivered';
  if (v.includes('paid')) return 'paid';
  return v;
}

export function normalizeOrderStatusRows(
  rawList: unknown[],
  session: Session,
  scope: 'admin' | 'shop' | 'customer'
): OrderStatusRow[] {
  const rows = rawList.map((raw, index) => {
    const record = toRecord(raw);
    const customer = pickNested(record, ['customer', 'user', 'buyer']);
    const shop = pickNested(record, ['shop', 'store', 'vendor']);

    const customerName =
      pickString(customer, ['full_name', 'name', 'username']) ||
      pickString(record, ['customer_name', 'customer', 'ordered_by', 'user_name']) ||
      'Customer';
    const shopName =
      pickString(shop, ['shop_name', 'name']) ||
      pickString(record, ['shop_name', 'vendor_name', 'store_name']) ||
      'Shop';

    const rawStatus = pickString(record, ['status', 'order_status']) || 'order placed';
    const paid = pickBool(record, ['paid', 'is_paid', 'payment_status']) ?? normalizeStatus(rawStatus).includes('paid');
    const id = pickString(record, ['id', 'order_id']) || `order-${index + 1}`;
    const refCode = pickString(record, ['ref', 'reference', 'ref_code', 'reference_code']) || id;

    const row: OrderStatusRow & { _customerId?: string; _shopId?: string } = {
      id,
      userName: scope === 'customer' ? shopName : customerName,
      orderedBy: scope === 'customer' ? customerName : shopName,
      email:
        pickString(customer, ['email']) ||
        pickString(record, ['email', 'customer_email']) ||
        '',
      product: pickProductLabel(record),
      phone:
        pickString(customer, ['phone', 'phone_number']) ||
        pickString(record, ['phone', 'phone_number', 'customer_phone']) ||
        '',
      paid,
      status: rawStatus,
      refCode,
      createdAt: pickString(record, ['created_at', 'created', 'updated_at', 'date']) || null,
      _customerId: pickString(customer, ['id']) || pickString(record, ['customer_id', 'user_id']),
      _shopId: pickString(shop, ['id']) || pickString(record, ['shop_id', 'vendor_id'])
    };

    return row;
  });

  const maybeFiltered = rows.filter((row) => {
    if (scope === 'admin') return true;
    if (!session.userId) return true;
    if (scope === 'customer') {
      return !row._customerId || String(row._customerId) === String(session.userId);
    }
    if (scope === 'shop') {
      return !row._shopId || String(row._shopId) === String(session.userId);
    }
    return true;
  });

  return maybeFiltered.map(({ _customerId, _shopId, ...row }) => row);
}

