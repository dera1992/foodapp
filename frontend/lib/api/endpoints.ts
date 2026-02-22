import { ApiError, apiRequest } from '@/lib/api/client';
import type {
  AdminAnalytics,
  ApiListResponse,
  BudgetSummary,
  Cart,
  CartItem,
  CustomerAnalytics,
  CustomerAnalyticsDashboard,
  Message,
  OrderSummary,
  Product,
  Shop,
  ShopAnalyticsDashboard,
  Thread
} from '@/types/api';

export const apiPaths = {
  shops: '/account/shops/',
  shopsFallback: '/home/shops/',
  shopById: (shopId: string) => `/account/shops/${shopId}/`,
  shopByIdFallback: (shopId: string) => `/home/shops/${shopId}/`,
  products: '/home/ads/',
  productsFallback: '/foodcreate/productss/',
  productById: (productId: string) => `/foodcreate/productss/${productId}/`,
  productByIdFallback: (productId: string) => `/home/ads/${productId}/`,
  cartList: '/cart/',
  cartAdd: '/cart/add/',
  cartRemove: '/cart/remove/',
  cartUpdateQuantity: '/cart/update_quantity/',
  cartOrderSummary: '/cart/order-summary/',
  addCoupon: '/order/add-coupon/',
  wishlist: '/home/favourites/',
  wishlistFallback: '/wishlist/',
  addWishlist: '/home/products/',
  removeWishlist: (itemId: string) => `/wishlist/items/${itemId}/`,
  customerAnalytics: '/home/analytics/customer/',
  budget: '/budget/',
  budgetItems: '/budget/items/',
  budgetItemById: (id: string) => `/budget/items/${id}/`,
  budgetTemplates: '/budget/templates/',
  budgetInsights: '/budget/insights/',
  budgetSaved: '/budget/saved/',
  threads: '/chat/threads/',
  threadById: (threadId: string) => `/chat/threads/${threadId}/`,
  sendReply: (threadId: string) => `/chat/threads/${threadId}/messages/`,
  adminAnalytics: '/home/analytics/shop/',
  adminProducts: '/foodcreate/productss/',
  adminOrders: '/order/orders/',
  adminCustomers: '/home/ads/customers/',
  createProduct: '/foodcreate/productss/'
} as const;

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function pickArray(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toShop(raw: unknown): Shop {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const id = String(record.id ?? record.shop_id ?? '');
  const name = pickString(record, ['shop_name', 'name', 'title']) ?? 'Local shop';
  return {
    id,
    name,
    image: pickString(record, ['image', 'shop_image']) ?? null,
    address: pickString(record, ['address', 'location']),
    city: pickString(record, ['city']),
    distanceKm: toNumber(record.distance ?? record.distance_km) || null,
    rating: toNumber(record.rating) || null,
    productsCount: toNumber(record.products_count) || undefined
  };
}

export function toProduct(raw: unknown): Product {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const name = pickString(record, ['title', 'name', 'product_name']) ?? 'Fresh deal item';
  const productId = String(record.id ?? record.product_id ?? '');
  const salePrice = toNumber(record.price);
  const oldPrice = toNumber(record.discount_price ?? record.old_price ?? record.oldPrice);
  const categories = pickArray(record, ['categories'])
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return pickString(item as Record<string, unknown>, ['name', 'title']);
      return undefined;
    })
    .filter(Boolean) as string[];
  const gallery = pickArray(record, ['gallery', 'images'])
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return pickString(item as Record<string, unknown>, ['image', 'url']);
      return undefined;
    })
    .filter(Boolean) as string[];
  const description = pickString(record, ['description']) ?? '';
  const oldPriceOrNull = oldPrice > salePrice ? oldPrice : null;

  return {
    id: productId,
    slug: pickString(record, ['slug']) ?? slugify(name),
    name,
    description,
    shortDescription: pickString(record, ['short_description']) ?? description,
    image: pickString(record, ['image', 'photo', 'thumbnail']) ?? null,
    gallery,
    category: pickString(record, ['category']) ?? categories[0],
    categories,
    price: salePrice,
    oldPrice: oldPriceOrNull,
    discountPercent: oldPriceOrNull ? Math.round(((oldPriceOrNull - salePrice) / oldPriceOrNull) * 100) : null,
    shopId: String(record.shop_id ?? record.shop ?? ''),
    shopName: pickString(record, ['shop_name', 'shop']),
    expiresOn: pickString(record, ['expiry_date', 'expires_on', 'best_before']) ?? null,
    status: pickString(record, ['status']) ?? null,
    delivery: pickString(record, ['delivery', 'delivery_mode', 'delivery_type']) ?? null,
    rating: toNumber(record.rating) || null,
    reviewCount: toNumber(record.review_count ?? record.reviews_count) || null
  };
}

function toCartItem(raw: unknown): CartItem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const product = record.product && typeof record.product === 'object' ? (record.product as Record<string, unknown>) : {};
  const productId = String(record.product_id ?? product.id ?? record.id ?? '');
  const quantity = Math.max(1, Math.floor(toNumber(record.quantity)));
  const unitPrice = toNumber(record.price ?? record.unit_price ?? product.price);
  const lineTotalRaw = toNumber(record.total_price ?? record.total ?? unitPrice * quantity);
  const lineTotal = lineTotalRaw > 0 ? lineTotalRaw : unitPrice * quantity;
  const oldPrice = toNumber(product.discount_price ?? product.old_price ?? product.oldPrice);
  const savings = oldPrice > unitPrice ? (oldPrice - unitPrice) * quantity : 0;

  return {
    id: String(record.id ?? productId),
    productId,
    name: pickString(product, ['title', 'name']) ?? pickString(record, ['name']) ?? 'Cart item',
    shopName: pickString(product, ['shop_name']) ?? pickString(record, ['shop_name']),
    image: pickString(product, ['image']) ?? pickString(record, ['image']) ?? null,
    quantity,
    unitPrice,
    lineTotal,
    savings: savings > 0 ? savings : 0
  };
}

function toCart(raw: unknown): Cart {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const cartItems = pickArray(record, ['items', 'cart_items']).map(toCartItem);
  const subtotal = toNumber(record.subtotal || record.total_price || record.total);
  const shipping = toNumber(record.shipping || record.shipping_cost);
  const total = toNumber(record.total) || subtotal + shipping;
  const savings = toNumber(record.discount || record.savings);
  const count = toNumber(record.count) || cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartItems,
    count,
    subtotal,
    shipping,
    savings,
    total,
    couponCode: pickString(record, ['coupon_code', 'couponCode'])
  };
}

function toOrderSummary(raw: unknown): OrderSummary {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    orderId: pickString(record, ['order_id', 'id']),
    ref: pickString(record, ['ref', 'reference']),
    items: toNumber(record.items ?? record.total_items),
    total: toNumber(record.total ?? record.total_price)
  };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function toCustomerAnalytics(raw: unknown): CustomerAnalytics {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const totalSpend = toNumber(record.total_spend ?? record.totalSpend);
  const totalOrders = toNumber(record.total_orders ?? record.totalOrders);
  const averageOrderValue = toNumber(record.avg_order_value ?? record.averageOrderValue) || (totalOrders > 0 ? totalSpend / totalOrders : 0);
  const wishlistCount = toNumber(record.wishlist_count ?? record.wishlistCount);
  const topCategoriesRaw = pickArray(record, ['top_categories', 'topCategories']);
  const topCategories = topCategoriesRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      return {
        name: pickString(entry, ['item__category__name', 'name']) ?? 'Category',
        quantity: toNumber(entry.total_quantity ?? entry.quantity)
      };
    })
    .filter((entry): entry is { name: string; quantity: number } => Boolean(entry));
  const subscribedShopsRaw = pickArray(record, ['subscribed_shops', 'subscribedShops']);
  const subscribedShops = subscribedShopsRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const nestedShop = entry.shop && typeof entry.shop === 'object' ? (entry.shop as Record<string, unknown>) : null;
      const name = nestedShop ? pickString(nestedShop, ['name']) : pickString(entry, ['name']);
      if (!name) return null;
      return {
        id: String((nestedShop?.id ?? entry.id ?? name) as string),
        name,
        image: nestedShop ? pickString(nestedShop, ['image']) : undefined,
        city: nestedShop ? pickString(nestedShop, ['city']) : pickString(entry, ['city'])
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const recentOrdersRaw = pickArray(record, ['recent_orders', 'recentOrders', 'completed_orders']);
  const recentOrders = recentOrdersRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const statusRaw = String(entry.status ?? entry.order_status ?? 'completed').toLowerCase();
      const status = statusRaw.includes('cancel') ? 'cancelled' : statusRaw.includes('pending') ? 'pending' : 'completed';
      return {
        id: String(entry.id ?? entry.ref ?? ''),
        status,
        total: toNumber(entry.total ?? entry.get_total ?? entry.amount),
        createdAt: pickString(entry, ['updated', 'created_at', 'date']) ?? new Date(0).toISOString()
      };
    })
    .filter((entry): entry is CustomerAnalytics['recentOrders'][number] => Boolean(entry && entry.id));

  return {
    totalSpend,
    totalOrders,
    averageOrderValue,
    wishlistCount,
    alertsCount: toNumber(record.unread_notifications ?? record.alerts_count),
    itemsBought: toNumber(record.total_items ?? record.items_bought),
    topCategories,
    subscribedShops,
    recentOrders
  };
}

function toShopAnalyticsDashboardFromRaw(raw: unknown): ShopAnalyticsDashboard {
  const list = Array.isArray(raw) ? raw : [];
  const first = list[0] && typeof list[0] === 'object' ? (list[0] as Record<string, unknown>) : {};
  const followerCount = toNumber(first.followers ?? first.follower_count);
  const products = toNumber(first.products ?? first.total_products);
  const shopName = pickString(first, ['shop', 'shop_name']) ?? 'Shop';

  return {
    identity: {
      shopName,
      followerCount,
      avgRating: toNumber(first.average_rating ?? first.avg_rating),
      reviewCount: toNumber(first.review_count)
    },
    totalRevenue: toNumber(first.total_revenue),
    totalOrders: toNumber(first.total_orders),
    itemsSold: toNumber(first.total_items_sold ?? products),
    avgOrderValue: toNumber(first.avg_order_value),
    uniqueBuyers: toNumber(first.customer_count),
    lowStockCount: toNumber(first.low_stock_count),
    topSellingItems: [],
    customerDemographics: [],
    inventory: { lowStock: [], popular: [], slowMovers: [] },
    subscription: { active: false, upgrades: [] }
  };
}

function normalizeListResponse<T>(payload: unknown): ApiListResponse<T> {
  if (Array.isArray(payload)) return { data: payload };
  if (!payload || typeof payload !== 'object') return { data: [] };

  const record = payload as Record<string, unknown>;
  const data = Array.isArray(record.data)
    ? (record.data as T[])
    : Array.isArray(record.results)
      ? (record.results as T[])
      : [];

  return {
    data,
    count: typeof record.count === 'number' ? record.count : data.length,
    next: typeof record.next === 'string' || record.next === null ? record.next : null,
    previous: typeof record.previous === 'string' || record.previous === null ? record.previous : null
  };
}

async function requestWithFallback<T>(paths: string[]): Promise<T> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await apiRequest<T>(path);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error('No API endpoint responded successfully.');
}

export async function getShops() {
  const payload = await requestWithFallback<unknown>([apiPaths.shops, apiPaths.shopsFallback]);
  const normalized = normalizeListResponse<unknown>(payload);
  return { ...normalized, data: normalized.data.map(toShop) };
}

export async function getShop(shopId: string) {
  const payload = await requestWithFallback<unknown>([apiPaths.shopById(shopId), apiPaths.shopByIdFallback(shopId)]);
  return toShop(payload);
}

export async function getProducts() {
  const payload = await requestWithFallback<unknown>([apiPaths.products, apiPaths.productsFallback]);
  const normalized = normalizeListResponse<unknown>(payload);
  return { ...normalized, data: normalized.data.map(toProduct) };
}

export async function getProduct(productId: string) {
  const payload = await requestWithFallback<unknown>([apiPaths.productById(productId), apiPaths.productByIdFallback(productId)]);
  return toProduct(payload);
}

export async function getCart() {
  const payload = await apiRequest<unknown>(apiPaths.cartList);
  return toCart(payload);
}

export async function addToCart(productId: string, quantity = 1) {
  const payload = await apiRequest<unknown>(apiPaths.cartAdd, {
    method: 'POST',
    body: { product_id: productId, quantity }
  });
  return toCart(payload);
}

export async function updateCartItem(productId: string, quantity: number) {
  const payload = await apiRequest<unknown>(apiPaths.cartUpdateQuantity, {
    method: 'POST',
    body: { product_id: productId, quantity }
  });
  return toCart(payload);
}

export async function removeCartItem(productId: string) {
  const payload = await apiRequest<unknown>(apiPaths.cartRemove, {
    method: 'POST',
    body: { product_id: productId }
  });
  return toCart(payload);
}

export async function applyCoupon(code: string) {
  const payload = await apiRequest<unknown>(apiPaths.addCoupon, {
    method: 'POST',
    body: { code }
  });
  return toCart(payload);
}

export async function getCartOrderSummary() {
  const payload = await apiRequest<unknown>(apiPaths.cartOrderSummary);
  return toOrderSummary(payload);
}

export async function getWishlist() {
  const payload = await requestWithFallback<unknown>([apiPaths.wishlist, apiPaths.wishlistFallback]);
  return normalizeListResponse<Product>(payload);
}

export async function addWishlist(productId: string) {
  return apiRequest(`${apiPaths.addWishlist}${productId}/favourite/`, {
    method: 'POST'
  });
}

export async function removeWishlist(itemId: string) {
  return apiRequest(apiPaths.removeWishlist(itemId), { method: 'DELETE' });
}

export async function getCustomerAnalytics() {
  const payload = await apiRequest<unknown>(apiPaths.customerAnalytics);
  return toCustomerAnalytics(payload);
}

export async function getCustomerAnalyticsDashboard(): Promise<CustomerAnalyticsDashboard> {
  const [analyticsResult, wishlistResult, shopsResult] = await Promise.allSettled([getCustomerAnalytics(), getWishlist(), getShops()]);
  const analytics =
    analyticsResult.status === 'fulfilled'
      ? analyticsResult.value
      : {
          totalSpend: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          wishlistCount: 0,
          topCategories: [],
          subscribedShops: [],
          recentOrders: []
        };

  const categoriesMax = Math.max(1, ...analytics.topCategories.map((item) => item.quantity));
  const topCategories = analytics.topCategories.map((item) => ({
    ...item,
    percent: clampPercent((item.quantity / categoriesMax) * 100)
  }));

  const favouriteShops = (shopsResult.status === 'fulfilled' ? shopsResult.value.data : [])
    .slice(0, 5)
    .map((shop) => ({
      id: shop.id,
      name: shop.name,
      location: [shop.address, shop.city].filter(Boolean).join(', ') || undefined,
      orders: 0
    }));

  const subscribedShops = analytics.subscribedShops.slice(0, 5).map((shop) => ({
    id: shop.id,
    name: shop.name,
    city: shop.city,
    subscribed: true
  }));

  const recentOrders = analytics.recentOrders.slice(0, 5).map((order) => {
    const status = String(order.status).toLowerCase();
    return {
      id: order.id,
      ref: order.id,
      total: order.total,
      date: order.createdAt,
      status: status.includes('cancel') ? 'cancelled' : status.includes('pending') ? 'pending' : 'completed'
    } as const;
  });

  return {
    totalSpend: analytics.totalSpend,
    totalOrders: analytics.totalOrders,
    avgOrderValue: analytics.averageOrderValue,
    wishlistCount: wishlistResult.status === 'fulfilled' ? wishlistResult.value.data.length : analytics.wishlistCount,
    alertsCount: analytics.alertsCount ?? 0,
    itemsBought: analytics.itemsBought ?? topCategories.reduce((sum, item) => sum + item.quantity, 0),
    topCategories,
    favouriteShops,
    subscribedShops,
    recentOrders
  };
}

export async function getBudget() {
  return apiRequest<BudgetSummary>(apiPaths.budget);
}

export async function createBudget(payload: { name: string; monthlyLimit: number }) {
  return apiRequest<BudgetSummary>(apiPaths.budget, { method: 'POST', body: payload });
}

export async function addBudgetItem(payload: { name: string; quantity: number; price: number }) {
  return apiRequest<BudgetSummary>(apiPaths.budgetItems, { method: 'POST', body: payload });
}

export async function updateBudgetItem(id: string, payload: { quantity?: number; price?: number }) {
  return apiRequest<BudgetSummary>(apiPaths.budgetItemById(id), { method: 'PATCH', body: payload });
}

export async function removeBudgetItem(id: string) {
  return apiRequest<BudgetSummary>(apiPaths.budgetItemById(id), { method: 'DELETE' });
}

export async function getSavedBudgets() {
  const payload = await apiRequest<unknown>(apiPaths.budgetSaved);
  return normalizeListResponse<BudgetSummary>(payload);
}

export async function saveTemplate(payload: { name: string; monthlyLimit: number }) {
  return apiRequest(apiPaths.budgetTemplates, { method: 'POST', body: payload });
}

export async function getInsights() {
  return apiRequest<{ insights: Array<{ title: string; body: string }> }>(apiPaths.budgetInsights);
}

export async function getThreads() {
  const payload = await apiRequest<unknown>(apiPaths.threads);
  return normalizeListResponse<Thread>(payload);
}

export async function getThread(threadId: string) {
  return apiRequest<{ thread: Thread; messages: Message[] }>(apiPaths.threadById(threadId));
}

export async function sendReply(threadId: string, body: string) {
  return apiRequest<Message>(apiPaths.sendReply(threadId), {
    method: 'POST',
    body: { body }
  });
}

export async function getAdminAnalytics() {
  const payload = await apiRequest<unknown>(apiPaths.adminAnalytics);
  const normalized = toShopAnalyticsDashboardFromRaw(payload);
  return {
    followers: normalized.identity.followerCount,
    averageRating: normalized.identity.avgRating,
    reviewCount: normalized.identity.reviewCount,
    revenue: normalized.totalRevenue,
    orders: normalized.totalOrders,
    lowStockCount: normalized.lowStockCount
  } satisfies AdminAnalytics;
}

export async function getShopAnalyticsDashboard(): Promise<ShopAnalyticsDashboard> {
  const [rawAnalyticsResult, productsResult, ordersResult, customersResult] = await Promise.allSettled([
    apiRequest<unknown>(apiPaths.adminAnalytics),
    getAdminProducts(),
    getAdminOrders(),
    getAdminCustomers()
  ]);

  const base = rawAnalyticsResult.status === 'fulfilled'
    ? toShopAnalyticsDashboardFromRaw(rawAnalyticsResult.value)
    : {
        identity: { shopName: 'Shop', followerCount: 0, avgRating: 0, reviewCount: 0 },
        totalRevenue: 0,
        totalOrders: 0,
        itemsSold: 0,
        avgOrderValue: 0,
        uniqueBuyers: 0,
        lowStockCount: 0,
        topSellingItems: [],
        customerDemographics: [],
        inventory: { lowStock: [], popular: [], slowMovers: [] },
        subscription: { active: false, upgrades: [] }
      };

  const products = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data : [];
  const customers = customersResult.status === 'fulfilled' ? customersResult.value.data : [];

  const lowStockProducts = products
    .map((product) => ({ name: product.name, stock: toNumber((product as unknown as Record<string, unknown>).stock) }))
    .filter((product) => product.stock > 0 && product.stock <= 5)
    .slice(0, 6);

  const topSellingItems = products.slice(0, 5).map((product, index) => ({
    name: product.name,
    units: Math.max(0, products.length - index)
  }));

  const maxCustomerOrders = Math.max(1, ...customers.map((customer) => customer.orders));
  const customerDemographics = customers.slice(0, 5).map((customer) => ({
    city: customer.name,
    customers: customer.orders,
    percent: clampPercent((customer.orders / maxCustomerOrders) * 100)
  }));

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0) || base.totalRevenue;
  const totalOrders = orders.length || base.totalOrders;
  const itemsSold = topSellingItems.reduce((sum, item) => sum + item.units, 0) || base.itemsSold;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : base.avgOrderValue;

  return {
    ...base,
    totalRevenue,
    totalOrders,
    itemsSold,
    avgOrderValue,
    uniqueBuyers: customers.length || base.uniqueBuyers,
    lowStockCount: lowStockProducts.length || base.lowStockCount,
    topSellingItems,
    customerDemographics,
    inventory: {
      lowStock: lowStockProducts,
      popular: topSellingItems.map((item) => ({ name: item.name, sold: item.units })),
      slowMovers: products.slice(-5).map((product) => ({ name: product.name }))
    },
    subscription: {
      ...base.subscription,
      upgrades: [
        { name: 'Starter', price: 9.99, productLimit: 50 },
        { name: 'Growth', price: 24.99, productLimit: 200 }
      ]
    }
  };
}

export async function getAdminProducts() {
  const payload = await apiRequest<unknown>(apiPaths.adminProducts);
  const normalized = normalizeListResponse<unknown>(payload);
  return { ...normalized, data: normalized.data.map(toProduct) };
}

export async function getAdminOrders() {
  const payload = await apiRequest<unknown>(apiPaths.adminOrders);
  return normalizeListResponse<{ id: string; customer: string; total: number; status: string }>(payload);
}

export async function getAdminCustomers() {
  const payload = await apiRequest<unknown>(apiPaths.adminCustomers);
  return normalizeListResponse<{ id: string; name: string; orders: number; spend: number }>(payload);
}

export async function createProduct(payload: Partial<Product>) {
  return apiRequest<Product>(apiPaths.createProduct, {
    method: 'POST',
    body: payload
  });
}
