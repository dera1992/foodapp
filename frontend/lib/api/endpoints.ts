import { ApiError, BASE_URL, apiRequest, formDataRequest } from '@/lib/api/client';
import type {
  AdminAnalytics,
  AdminUser,
  ApiListResponse,
  BudgetSummary,
  Cart,
  CartItem,
  CustomerAnalytics,
  CustomerAnalyticsDashboard,
  CustomerProfile,
  DispatcherProfile,
  Message,
  OrderSummary,
  Product,
  Shop,
  ShopAnalyticsDashboard,
  ShopFollower,
  ShopIntegration,
  ShopNotification,
  ShopReview,
  ShopSubscription,
  SubscriptionPlan,
  Thread
} from '@/types/api';

export const apiPaths = {
  shops: '/account/shops/',
  shopsFallback: '/home/shops/',
  shopById: (shopId: string) => `/account/shops/${shopId}/`,
  shopByIdFallback: (shopId: string) => `/home/shops/${shopId}/`,
  subscribeShop: (shopId: string) => `/home/shops/${shopId}/subscribe/`,
  products: '/home/ads/',
  productsAll: '/home/ads/all/',
  productByIdSlug: (productId: string, slug: string) => `/home/ads/${productId}/${slug}/`,
  productPreviewByIdSlug: (productId: string, slug: string) => `/home/ads/${productId}/${slug}/preview/`,
  productToggleFavourite: (productId: string) => `/home/ads/${productId}/toggle-favourite/`,
  productDeleteLegacy: (productId: string) => `/home/ads/${productId}/delete/`,
  productsFallback: '/foodcreate/productss/',
  foodcreateCategories: '/foodcreate/categorys/',
  foodcreateCategoryById: (id: string) => `/foodcreate/categorys/${id}/`,
  foodcreateProductImages: '/foodcreate/products-imagess/',
  foodcreateProductImageById: (id: string) => `/foodcreate/products-imagess/${id}/`,
  foodcreateProducts: '/foodcreate/productss/',
  foodcreateProductById: (id: string) => `/foodcreate/productss/${id}/`,
  foodcreateProductDuplicate: (id: string) => `/foodcreate/productss/${id}/duplicate/`,
  foodcreateProductLoadSubcategories: '/foodcreate/productss/load-subcategories/',
  foodcreateProductLookup: '/foodcreate/productss/lookup-product/',
  foodcreateReviewRatings: '/foodcreate/review-ratings/',
  foodcreateReviewRatingById: (id: string) => `/foodcreate/review-ratings/${id}/`,
  foodcreateSubCategories: '/foodcreate/sub-categorys/',
  foodcreateSubCategoryById: (id: string) => `/foodcreate/sub-categorys/${id}/`,
  productById: (productId: string) => `/foodcreate/productss/${productId}/`,
  productByIdFallback: (productId: string) => `/home/ads/${productId}/`,
  submitReview: (postId: string) => `/home/submit-review/${postId}/`,
  cartList: '/cart/',
  cartAdd: '/cart/add/',
  cartAddToCart: '/cart/add-to-cart/',
  cartAddToCartAjax: '/cart/add-to-cart-ajax/',
  cartClear: '/cart/clear/',
  cartRemove: '/cart/remove/',
  cartRemoveFromCart: '/cart/remove-from-cart/',
  cartRemoveSingleFromCart: '/cart/remove-single-item-from-cart/',
  cartUpdateQuantity: '/cart/update_quantity/',
  cartOrderSummary: '/cart/order-summary/',
  addCoupon: '/order/add-coupon/',
  wishlist: '/home/favourites/',
  wishlistFallback: '/wishlist/',
  addWishlist: '/home/products/',
  removeWishlist: (itemId: string) => `/home/wishlist-items/${itemId}/`,
  removeWishlistByProduct: (productId: string) => `/home/products/${productId}/favourite/`,
  wishlistItems: '/home/wishlist-items/',
  wishlistItemById: (id: string) => `/home/wishlist-items/${id}/`,
  wishlistNotifications: '/home/wishlist-notifications/',
  wishlistNotificationById: (id: string) => `/home/wishlist-notifications/${id}/`,
  wishlistPreferences: (itemId: string) => `/home/wishlist/${itemId}/preferences/`,
  customerAnalytics: '/home/analytics/customer/',
  dispatcherAnalytics: '/home/analytics/dispatcher/',
  homeDashboard: '/home/dashboard/',
  homeCategoryCount: '/home/category-count/',
  nearbyShops: '/home/nearby-shops/',
  budget: '/budget/budgets/',
  budgetById: (id: string) => `/budget/budgets/${id}/`,
  budgetAddItem: (id: string) => `/budget/budgets/${id}/add-item/`,
  budgetDuplicate: (id: string) => `/budget/budgets/${id}/duplicate/`,
  budgetFromCart: (id: string) => `/budget/budgets/${id}/from-cart/`,
  budgetRemoveItem: (id: string) => `/budget/budgets/${id}/remove-item/`,
  budgetUpdateItemQuantity: (id: string) => `/budget/budgets/${id}/update-item-quantity/`,
  budgetItems: '/budget/shopping-list-items/',
  budgetItemById: (id: string) => `/budget/shopping-list-items/${id}/`,
  budgetTemplateItems: '/budget/budget-template-items/',
  budgetTemplateItemById: (id: string) => `/budget/budget-template-items/${id}/`,
  budgetTemplates: '/budget/budget-templates/',
  budgetTemplateById: (id: string) => `/budget/budget-templates/${id}/`,
  budgetTemplateAddItem: (id: string) => `/budget/budget-templates/${id}/add-item/`,
  budgetTemplateApply: (id: string) => `/budget/budget-templates/${id}/apply/`,
  budgetTemplateRemoveItem: (id: string) => `/budget/budget-templates/${id}/remove-item/`,
  budgetInsights: '/budget/insights/',
  budgetSaved: '/budget/saved/',
  threads: '/chat/inbox/',
  chatMessages: '/chat/messages/',
  chatMessageById: (id: string) => `/chat/messages/${id}/`,
  chatSend: '/chat/send/',
  chatThreadByParticipants: (shopId: string, userId: string) => `/chat/thread/${shopId}/${userId}/`,
  chatThreadMessagesByParticipants: (shopId: string, userId: string) => `/chat/thread/${shopId}/${userId}/messages/`,
  threadById: (threadId: string) => `/chat/threads/${threadId}/`,
  sendReply: (threadId: string) => `/chat/threads/${threadId}/messages/`,
  comments: '/comments/comments/',
  commentById: (id: string) => `/comments/comments/${id}/`,
  adminAnalytics: '/home/analytics/shop/',
  adminProducts: '/foodcreate/productss/',
  adminOrders: '/order/orders/',
  myOrders: '/order/my-orders/',
  adminCustomers: '/home/ads/customers/',
  orderTracking: '/order/tracking/',
  createProduct: '/foodcreate/productss/',
  shopNotifications: '/account/shop-notifications/',
  homeShopNotifications: '/home/shop-notifications/',
  shopNotificationById: (id: string) => `/account/shop-notifications/${id}/`,
  shopSubscriptions: '/account/shop-subscriptions/',
  shopSubscriptionById: (id: string) => `/account/shop-subscriptions/${id}/`,
  subscriptionPlans: '/account/subscription-plans/',
  subscriptionPlanById: (id: string) => `/account/subscription-plans/${id}/`,
  adminUsers: '/account/users/',
  adminUserById: (id: string) => `/account/users/${id}/`,
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
  const ownerRecord = record.owner && typeof record.owner === 'object' ? (record.owner as Record<string, unknown>) : null;
  const name = pickString(record, ['shop_name', 'name', 'title']) ?? 'Local shop';
  const cats = pickArray(record, ['categories'])
    .map((c) => (typeof c === 'string' ? c : pickString(c as Record<string, unknown>, ['name']) ?? ''))
    .filter(Boolean) as string[];
  return {
    id,
    ownerUserId: record.owner_id != null
      ? String(record.owner_id)
      : record.owner != null && typeof record.owner !== 'object'
        ? String(record.owner)
        : ownerRecord?.id != null
          ? String(ownerRecord.id)
          : record.user != null && typeof record.user !== 'object'
            ? String(record.user)
            : undefined,
    slug: pickString(record, ['slug']) ?? slugify(name),
    name,
    image: pickString(record, ['image', 'shop_image']) ?? null,
    emoji: pickString(record, ['emoji']) ?? 'Store',
    address: pickString(record, ['address', 'location']),
    city: pickString(record, ['city']),
    description: pickString(record, ['description', 'bio']),
    isOpen: typeof record.is_open === 'boolean' ? record.is_open : typeof record.isOpen === 'boolean' ? record.isOpen : true,
    distanceKm: toNumber(record.distance ?? record.distance_km) || null,
    rating: toNumber(record.rating) || null,
    latitude: record.latitude != null ? toNumber(record.latitude) : null,
    longitude: record.longitude != null ? toNumber(record.longitude) : null,
    productsCount: toNumber(record.products_count ?? record.product_count) || undefined,
    subscriberCount: toNumber(record.subscribers ?? record.subscriber_count ?? record.followers) || undefined,
    memberSince: pickString(record, ['member_since', 'joined', 'created_at']),
    phone: pickString(record, ['phone', 'phone_number']),
    email: pickString(record, ['email']),
    openingHours: pickString(record, ['opening_hours', 'hours']),
    categories: cats.length ? cats : undefined,
  };
}

function toReview(raw: unknown): ShopReview {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: String(r.id ?? ''),
    author: pickString(r, ['author', 'user', 'username', 'name']) ?? 'Anonymous',
    rating: toNumber(r.rating) || 5,
    body: pickString(r, ['body', 'text', 'comment', 'review']) ?? '',
    createdAt: pickString(r, ['created_at', 'date', 'createdAt']) ?? new Date().toISOString(),
  };
}

function encodeChatThreadId(shopId: string | number, userId: string | number): string {
  return `${shopId}:${userId}`;
}

function decodeChatThreadId(threadId: string): { shopId: string; userId: string } | null {
  let normalized = threadId;
  try {
    normalized = decodeURIComponent(threadId);
  } catch {
    normalized = threadId;
  }
  const parts = normalized.split(':');
  if (parts.length !== 2) return null;
  const [shopId, userId] = parts;
  if (!shopId || !userId) return null;
  return { shopId, userId };
}

function toChatUiMessage(raw: unknown, viewerUserId?: string | number | null): Message {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const senderRecord = record.sender && typeof record.sender === 'object'
    ? (record.sender as Record<string, unknown>)
    : null;
  const senderId = String(record.sender_id ?? senderRecord?.id ?? record.sender ?? '');
  const productRaw = record.product;
  const productRecord =
    productRaw && typeof productRaw === 'object' ? (productRaw as Record<string, unknown>) : null;
  const productIdValue = record.product_id ?? productRecord?.id ?? (typeof productRaw === 'number' ? productRaw : undefined);
  const productId = productIdValue != null && String(productIdValue) !== '' ? String(productIdValue) : undefined;
  const productName =
    pickString(productRecord ?? {}, ['name', 'title']) ??
    (typeof productRaw === 'string'
      ? productRaw
      : typeof productRaw === 'number'
        ? `Product #${productRaw}`
        : undefined);
  const explicitIsMine =
    typeof record.is_mine === 'boolean'
      ? record.is_mine
      : typeof record.isMine === 'boolean'
        ? record.isMine
        : undefined;
  return {
    id: String(record.id ?? ''),
    senderName: pickString(record, ['sender_name', 'senderName']) ?? (senderId ? `User ${senderId}` : 'User'),
    senderId,
    body: pickString(record, ['body', 'content', 'message']) ?? '',
    productId,
    productName,
    createdAt: pickString(record, ['createdAt', 'created_at', 'timestamp']) ?? new Date().toISOString(),
    isMine:
      explicitIsMine ??
      (viewerUserId != null && String(viewerUserId) !== ''
        ? senderId === String(viewerUserId)
        : undefined)
  };
}

function toChatUiThread(raw: unknown, viewerUserId?: string | number | null): Thread {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const shopRecord = record.shop && typeof record.shop === 'object' ? (record.shop as Record<string, unknown>) : null;
  const otherUserRecord =
    (record.other_user && typeof record.other_user === 'object'
      ? (record.other_user as Record<string, unknown>)
      : record.user && typeof record.user === 'object'
        ? (record.user as Record<string, unknown>)
        : null);
  const customerRecord =
    record.customer && typeof record.customer === 'object' ? (record.customer as Record<string, unknown>) : null;
  const lastMessageRaw = record.last_message;
  const lastMessageRecord =
    lastMessageRaw && typeof lastMessageRaw === 'object' ? (lastMessageRaw as Record<string, unknown>) : null;
  const lastMessageShopRecord =
    lastMessageRecord?.shop && typeof lastMessageRecord.shop === 'object'
      ? (lastMessageRecord.shop as Record<string, unknown>)
      : null;
  const lastMessageSenderRecord =
    lastMessageRecord?.sender && typeof lastMessageRecord.sender === 'object'
      ? (lastMessageRecord.sender as Record<string, unknown>)
      : null;
  const lastMessageReceiverRecord =
    lastMessageRecord?.receiver && typeof lastMessageRecord.receiver === 'object'
      ? (lastMessageRecord.receiver as Record<string, unknown>)
      : null;

  const shopId = String(
    record.shop_id ??
      record.shopId ??
      shopRecord?.id ??
      shopRecord?.pk ??
      (typeof record.shop === 'string' || typeof record.shop === 'number' ? record.shop : undefined) ??
      lastMessageRecord?.shop_id ??
      (lastMessageRecord?.shopId as string | number | undefined) ??
      lastMessageShopRecord?.id ??
      lastMessageShopRecord?.pk ??
      (lastMessageRecord &&
      (typeof lastMessageRecord.shop === 'string' || typeof lastMessageRecord.shop === 'number')
        ? lastMessageRecord.shop
        : undefined) ??
      ''
  );

  const senderId = String(
    lastMessageRecord?.sender_id ??
      lastMessageSenderRecord?.id ??
      lastMessageSenderRecord?.pk ??
      (lastMessageRecord &&
      (typeof lastMessageRecord.sender === 'string' || typeof lastMessageRecord.sender === 'number')
        ? lastMessageRecord.sender
        : undefined) ??
      ''
  );
  const receiverId = String(
    lastMessageRecord?.receiver_id ??
      lastMessageReceiverRecord?.id ??
      lastMessageReceiverRecord?.pk ??
      (lastMessageRecord &&
      (typeof lastMessageRecord.receiver === 'string' || typeof lastMessageRecord.receiver === 'number')
        ? lastMessageRecord.receiver
        : undefined) ??
      ''
  );
  const viewerId = viewerUserId != null && String(viewerUserId) !== '' ? String(viewerUserId) : '';
  const inferredCounterpartyId =
    viewerId && senderId && receiverId ? (senderId === viewerId ? receiverId : senderId) : '';
  const shopOwnerId = String(
    shopRecord?.owner_id ??
      (shopRecord?.owner && typeof shopRecord.owner !== 'object' ? shopRecord.owner : undefined) ??
      (shopRecord?.owner && typeof shopRecord.owner === 'object'
        ? (shopRecord.owner as Record<string, unknown>).id ?? (shopRecord.owner as Record<string, unknown>).pk
        : undefined) ??
      lastMessageShopRecord?.owner_id ??
      (lastMessageShopRecord?.owner && typeof lastMessageShopRecord.owner !== 'object' ? lastMessageShopRecord.owner : undefined) ??
      (lastMessageShopRecord?.owner && typeof lastMessageShopRecord.owner === 'object'
        ? (lastMessageShopRecord.owner as Record<string, unknown>).id ?? (lastMessageShopRecord.owner as Record<string, unknown>).pk
        : undefined) ??
      ''
  );
  const inferredRouteUserId =
    viewerId && shopId
      ? (shopOwnerId && viewerId === shopOwnerId ? inferredCounterpartyId || viewerId : viewerId)
      : inferredCounterpartyId;

  const routeUserId = String(
    record.user_id ??
      record.customer_id ??
      record.other_user_id ??
      record.userId ??
      record.customerId ??
      record.participant_user_id ??
      record.thread_user_id ??
      customerRecord?.id ??
      customerRecord?.pk ??
      (record.user && (typeof record.user === 'string' || typeof record.user === 'number') ? record.user : undefined) ??
      otherUserRecord?.id ??
      otherUserRecord?.pk ??
      inferredRouteUserId ??
      ''
  );

  const explicitOtherUserId = String(record.other_user_id ?? otherUserRecord?.id ?? otherUserRecord?.pk ?? '');
  const isViewerShopOwner = Boolean(viewerId && shopOwnerId && viewerId === shopOwnerId);
  const normalizedRouteUserId = !isViewerShopOwner && explicitOtherUserId ? explicitOtherUserId : routeUserId;
  const lastMessage = lastMessageRecord ? toChatUiMessage(lastMessageRecord, viewerUserId) : null;
  const shopName =
    pickString(record, ['shop_name']) ??
    pickString(shopRecord ?? {}, ['name']) ??
    pickString(lastMessageShopRecord ?? {}, ['name']) ??
    'Conversation';
  const otherUserEmail =
    pickString(record, ['other_user_email']) ??
    pickString(otherUserRecord ?? {}, ['email']) ??
    pickString(customerRecord ?? {}, ['email']);

  return {
    id:
      shopId && normalizedRouteUserId
        ? encodeChatThreadId(shopId, normalizedRouteUserId)
        : String(record.id ?? record.thread_id ?? record.conversation_id ?? ''),
    shopId: shopId || undefined,
    otherUserId: normalizedRouteUserId || undefined,
    title: otherUserEmail ? `${shopName} - ${otherUserEmail}` : shopName,
    lastMessage: lastMessage?.body ?? pickString(record, ['last_message_text', 'lastMessage']),
    updatedAt: lastMessage?.createdAt ?? pickString(record, ['updated_at', 'updatedAt']) ?? new Date().toISOString(),
    unreadCount: toNumber(record.unread_count ?? record.unreadCount) || undefined
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

export async function getCurrentUserId(): Promise<string | number | null> {
  try {
    const me = await apiRequest<unknown>('/auth/me/');
    if (me && typeof me === 'object' && !Array.isArray(me)) {
      const id = (me as Record<string, unknown>).id;
      if (typeof id === 'string' || typeof id === 'number') return id;
    }
    return null;
  } catch {
    return null;
  }
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
  const payload = await requestWithFallback<unknown>([apiPaths.products, apiPaths.productsAll, apiPaths.productsFallback]);
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
  let lastError: unknown = null;
  for (const path of [apiPaths.cartAdd, apiPaths.cartAddToCart, apiPaths.cartAddToCartAjax]) {
    try {
      await apiRequest<unknown>(path, {
        method: 'POST',
        body: { product_id: productId, quantity }
      });
      return getCart();
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Unable to add to cart.');
}

export async function updateCartItem(productId: string, quantity: number) {
  await apiRequest<unknown>(apiPaths.cartUpdateQuantity, {
    method: 'POST',
    body: { product_id: productId, quantity }
  });
  return getCart();
}

export async function removeCartItem(productId: string) {
  let lastError: unknown = null;
  for (const path of [apiPaths.cartRemove, apiPaths.cartRemoveFromCart]) {
    try {
      await apiRequest<unknown>(path, {
        method: 'POST',
        body: { product_id: productId }
      });
      return getCart();
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Unable to remove item from cart.');
}

export async function removeSingleCartItem(productId: string) {
  await apiRequest<unknown>(apiPaths.cartRemoveSingleFromCart, {
    method: 'POST',
    body: { product_id: productId, quantity: 1 }
  });
  return getCart();
}

export async function clearCart() {
  await apiRequest<unknown>(apiPaths.cartClear, {
    method: 'POST',
    body: {}
  });
  return getCart();
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
  let lastError: unknown;
  for (const path of [`${apiPaths.addWishlist}${productId}/favourite/`, apiPaths.productToggleFavourite(productId)]) {
    try {
      return await apiRequest(path, { method: 'POST' });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Unable to add wishlist item.');
}

export async function removeWishlist(itemId: string) {
  return apiRequest(apiPaths.removeWishlist(itemId), { method: 'DELETE' });
}

export async function removeWishlistByProduct(productId: string) {
  let lastError: unknown;
  for (const path of [apiPaths.removeWishlistByProduct(productId), apiPaths.productToggleFavourite(productId)]) {
    try {
      return await apiRequest(path, { method: 'DELETE' });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Unable to remove wishlist item.');
}

export async function getWishlistItems() {
  const payload = await apiRequest<unknown>(apiPaths.wishlistItems);
  return normalizeListResponse<unknown>(payload);
}

export async function getWishlistItem(id: string) {
  return apiRequest<unknown>(apiPaths.wishlistItemById(id));
}

export async function createWishlistItem(payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistItems, { method: 'POST', body: payload });
}

export async function updateWishlistItem(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistItemById(id), { method: 'PUT', body: payload });
}

export async function patchWishlistItem(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistItemById(id), { method: 'PATCH', body: payload });
}

export async function deleteWishlistItem(id: string) {
  return apiRequest<unknown>(apiPaths.wishlistItemById(id), { method: 'DELETE' });
}

export async function saveWishlistPreferences(itemId: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistPreferences(itemId), { method: 'POST', body: payload });
}

export async function getCustomerAnalytics() {
  const payload = await apiRequest<unknown>(apiPaths.customerAnalytics);
  return toCustomerAnalytics(payload);
}

export async function getDispatcherAnalytics() {
  return apiRequest<unknown>(apiPaths.dispatcherAnalytics);
}

export async function getHomeDashboard() {
  return apiRequest<unknown>(apiPaths.homeDashboard);
}

export async function getHomeCategoryCount() {
  return apiRequest<unknown>(apiPaths.homeCategoryCount);
}

export async function getNearbyShops() {
  const payload = await apiRequest<unknown>(apiPaths.nearbyShops);
  const normalized = normalizeListResponse<unknown>(payload);
  return { ...normalized, data: normalized.data.map(toShop) };
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

export type BudgetTemplateItemInput = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
};

export type BudgetTemplateSummary = {
  id: string;
  name: string;
  monthlyLimit: number;
  itemCount: number;
  items?: BudgetTemplateItemInput[];
};

function unwrapBudgetPayload(raw: unknown, keys: string[] = ['budget', 'data', 'result']): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const record = raw as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] != null) return record[key];
  }
  return raw;
}

function toBudgetItem(raw: unknown): BudgetSummary['items'][number] {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const productId = record.product != null ? String(record.product) : '';
  const explicitName = pickString(record, ['name', 'item_name', 'product_name', 'title']);
  return {
    id: String(record.id ?? record.item_id ?? record.shopping_list_item_id ?? ''),
    productId: productId || undefined,
    name: explicitName || (productId ? `Product #${productId}` : 'Budget item'),
    price: toNumber(record.price ?? record.unit_price ?? record.amount),
    quantity: Math.max(1, Math.floor(toNumber(record.quantity ?? record.qty ?? 1))),
    category: pickString(record, ['category', 'category_name'])
  };
}

function toBudgetSummary(raw: unknown): BudgetSummary {
  const unwrapped = unwrapBudgetPayload(raw);
  const record = unwrapped && typeof unwrapped === 'object'
    ? (unwrapped as Record<string, unknown>)
    : {};
  const monthlyLimit = toNumber(record.total_budget ?? record.monthly_limit ?? record.monthlyLimit ?? record.limit ?? record.budget_limit);
  const spent = toNumber(record.spent ?? record.spent_amount ?? record.planned_spend ?? record.total_spent);
  const items = pickArray(record, ['items', 'budget_items', 'shopping_list_items']).map(toBudgetItem);
  const remainingRaw = record.remaining ?? record.remaining_amount ?? record.balance;
  const remaining = remainingRaw != null ? toNumber(remainingRaw) : monthlyLimit - spent;
  return {
    id: String(record.id ?? record.budget_id ?? ''),
    name: pickString(record, ['name', 'title']) ?? (monthlyLimit > 0 ? `Budget ${monthlyLimit}` : 'Shopping Budget'),
    monthlyLimit,
    spent,
    remaining,
    items,
    insights: pickArray(record, ['insights']).map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      return {
        title: pickString(entry, ['title']) ?? 'Insight',
        body: pickString(entry, ['body', 'message']) ?? ''
      };
    }).filter((item): item is NonNullable<BudgetSummary['insights']>[number] => Boolean(item))
  };
}

function toBudgetTemplateSummary(raw: unknown): BudgetTemplateSummary {
  const unwrapped = unwrapBudgetPayload(raw, ['template', 'data', 'result']);
  const record = unwrapped && typeof unwrapped === 'object'
    ? (unwrapped as Record<string, unknown>)
    : {};
  const items = pickArray(record, ['items', 'template_items', 'budget_template_items']).map(toBudgetItem);
  const itemCount = toNumber(record.items_count ?? record.item_count ?? items.length);
  return {
    id: String(record.id ?? record.template_id ?? ''),
    name: pickString(record, ['name', 'title']) ?? 'Budget Template',
    monthlyLimit: toNumber(record.monthly_limit ?? record.monthlyLimit ?? record.limit ?? record.budget_limit),
    itemCount,
    items: items.length ? items : undefined
  };
}

function isBudgetRecord(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const record = raw as Record<string, unknown>;
  return 'total_budget' in record || 'monthly_limit' in record || 'budget_id' in record;
}

async function getBudgetItemsForBudget(budgetId: string): Promise<BudgetSummary['items']> {
  try {
    const payload = await apiRequest<unknown>(apiPaths.budgetItems);
    const normalized = normalizeListResponse<unknown>(payload);
    return normalized.data
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        return String(record.budget ?? record.budget_id ?? '') === String(budgetId);
      })
      .map(toBudgetItem);
  } catch {
    return [];
  }
}

async function getBudgetTemplateItemsForTemplate(templateId: string): Promise<BudgetTemplateItemInput[]> {
  try {
    const payload = await apiRequest<unknown>(apiPaths.budgetTemplateItems);
    const normalized = normalizeListResponse<unknown>(payload);
    return normalized.data
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        return String(record.template ?? record.template_id ?? '') === String(templateId);
      })
      .map((item) => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record.id ?? ''),
          productId: record.product != null ? String(record.product) : undefined,
          name: pickString(record, ['name']) ?? (record.product != null ? `Product #${record.product}` : 'Template item'),
          quantity: Math.max(1, Math.floor(toNumber(record.quantity ?? 1))),
          price: toNumber(record.price)
        };
      });
  } catch {
    return [];
  }
}

async function hydrateBudget(raw: unknown): Promise<BudgetSummary> {
  const base = toBudgetSummary(raw);
  if (!base.id) return base;
  const items = await getBudgetItemsForBudget(base.id);
  const spent = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    ...base,
    items,
    spent,
    remaining: base.monthlyLimit - spent
  };
}

async function coerceBudgetFromAction(raw: unknown, budgetId?: string): Promise<BudgetSummary> {
  if (isBudgetRecord(unwrapBudgetPayload(raw))) {
    return hydrateBudget(raw);
  }
  if (budgetId) return getBudgetById(budgetId);
  return getBudget();
}

export async function getBudgets() {
  const payload = await apiRequest<unknown>(apiPaths.budget);
  const normalized = normalizeListResponse<unknown>(payload);
  const data = await Promise.all(normalized.data.map((item) => hydrateBudget(item)));
  return { ...normalized, data };
}

export async function getBudgetById(id: string) {
  const payload = await apiRequest<unknown>(apiPaths.budgetById(id));
  return hydrateBudget(payload);
}

export async function getBudget(budgetId?: string) {
  if (budgetId) return getBudgetById(budgetId);
  const payload = await apiRequest<unknown>(apiPaths.budget);
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first) throw new Error('No budgets found');
    return hydrateBudget(first);
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results) || Array.isArray(record.data)) {
      const normalized = normalizeListResponse<unknown>(payload);
      const first = normalized.data[0];
      if (!first) throw new Error('No budgets found');
      return hydrateBudget(first);
    }
  }
  return hydrateBudget(payload);
}

export async function createBudget(payload: { name: string; monthlyLimit: number }) {
  try {
    const raw = await apiRequest<unknown>(apiPaths.budget, {
      method: 'POST',
      body: { total_budget: payload.monthlyLimit }
    });
    return hydrateBudget(raw);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400) throw error;
    const userId = await getCurrentUserId();
    if (userId == null) throw error;
    const raw = await apiRequest<unknown>(apiPaths.budget, {
      method: 'POST',
      body: { total_budget: payload.monthlyLimit, user: userId }
    });
    return hydrateBudget(raw);
  }
}

export async function updateBudget(id: string, payload: Partial<{ name: string; monthlyLimit: number }>) {
  const raw = await apiRequest<unknown>(apiPaths.budgetById(id), {
    method: 'PATCH',
    body: {
      ...(payload.monthlyLimit != null ? { total_budget: payload.monthlyLimit } : {})
    }
  });
  return hydrateBudget(raw);
}

export async function deleteBudget(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.budgetById(id), { method: 'DELETE' });
}

export async function addBudgetItem(payload: { name: string; quantity: number; price: number }, budgetId?: string) {
  if (!budgetId) {
    throw new Error('Budget ID is required to add items.');
  }
  const raw = await apiRequest<unknown>(apiPaths.budgetAddItem(budgetId), {
    method: 'POST',
    body: {
      name: payload.name,
      quantity: payload.quantity
    }
  });
  return coerceBudgetFromAction(raw, budgetId);
}

export async function updateBudgetItem(id: string, payload: { quantity?: number; price?: number }, budgetId?: string) {
  if (!budgetId) {
    throw new Error('Budget ID is required to update items.');
  }
  const raw = await apiRequest<unknown>(apiPaths.budgetUpdateItemQuantity(budgetId), {
    method: 'POST',
    body: { item_id: id, quantity: payload.quantity }
  });
  return coerceBudgetFromAction(raw, budgetId);
}

export async function removeBudgetItem(id: string, budgetId?: string) {
  if (!budgetId) {
    throw new Error('Budget ID is required to remove items.');
  }
  const raw = await apiRequest<unknown>(apiPaths.budgetRemoveItem(budgetId), {
    method: 'POST',
    body: { item_id: id }
  });
  return coerceBudgetFromAction(raw, budgetId);
}

export async function duplicateBudget(id: string) {
  const raw = await apiRequest<unknown>(apiPaths.budgetDuplicate(id), { method: 'POST', body: {} });
  return hydrateBudget(raw);
}

export async function addBudgetItemsFromCart(id: string) {
  const raw = await apiRequest<unknown>(apiPaths.budgetFromCart(id), { method: 'POST', body: {} });
  return coerceBudgetFromAction(raw, id);
}

export async function getSavedBudgets() {
  try {
    return await getBudgets();
  } catch {
    const payload = await apiRequest<unknown>(apiPaths.budgetSaved);
    const normalized = normalizeListResponse<unknown>(payload);
    return { ...normalized, data: normalized.data.map(toBudgetSummary) };
  }
}

export async function getBudgetTemplates() {
  const payload = await apiRequest<unknown>(apiPaths.budgetTemplates);
  const normalized = normalizeListResponse<unknown>(payload);
  const baseTemplates = normalized.data.map(toBudgetTemplateSummary);
  const hydrated = await Promise.all(
    baseTemplates.map(async (template) => {
      const items = await getBudgetTemplateItemsForTemplate(template.id);
      return {
        ...template,
        itemCount: items.length || template.itemCount,
        items: items.length ? items : template.items
      };
    })
  );
  return { ...normalized, data: hydrated };
}

export async function getBudgetTemplate(id: string) {
  const payload = await apiRequest<unknown>(apiPaths.budgetTemplateById(id));
  const base = toBudgetTemplateSummary(payload);
  const items = await getBudgetTemplateItemsForTemplate(base.id);
  return {
    ...base,
    itemCount: items.length || base.itemCount,
    items: items.length ? items : base.items
  };
}

export async function updateBudgetTemplate(id: string, payload: Partial<{ name: string }>) {
  const raw = await apiRequest<unknown>(apiPaths.budgetTemplateById(id), {
    method: 'PATCH',
    body: {
      ...(payload.name != null ? { name: payload.name } : {})
    }
  });
  return toBudgetTemplateSummary(raw);
}

export async function deleteBudgetTemplate(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.budgetTemplateById(id), { method: 'DELETE' });
}

export async function addBudgetTemplateItem(templateId: string, item: BudgetTemplateItemInput) {
  if (!item.productId) throw new Error('Template item requires a product ID.');
  const raw = await apiRequest<unknown>(apiPaths.budgetTemplateAddItem(templateId), {
    method: 'POST',
    body: {
      product_id: item.productId,
      quantity: item.quantity
    }
  });
  return toBudgetTemplateSummary(raw);
}

export async function removeBudgetTemplateItem(templateId: string, itemId: string) {
  const raw = await apiRequest<unknown>(apiPaths.budgetTemplateRemoveItem(templateId), {
    method: 'POST',
    body: { item_id: itemId, id: itemId }
  });
  return toBudgetTemplateSummary(raw);
}

export async function applyBudgetTemplate(templateId: string, budgetId?: string) {
  if (!budgetId) throw new Error('Budget ID is required to apply a template.');
  const raw = await apiRequest<unknown>(apiPaths.budgetTemplateApply(templateId), {
    method: 'POST',
    body: { budget_id: budgetId }
  });
  return coerceBudgetFromAction(raw, budgetId);
}

export async function saveTemplate(payload: { name: string; monthlyLimit: number; items?: BudgetTemplateItemInput[] }) {
  let createdRaw: unknown;
  try {
    createdRaw = await apiRequest<unknown>(apiPaths.budgetTemplates, {
      method: 'POST',
      body: { name: payload.name }
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400) throw error;
    const userId = await getCurrentUserId();
    if (userId == null) throw error;
    createdRaw = await apiRequest<unknown>(apiPaths.budgetTemplates, {
      method: 'POST',
      body: { name: payload.name, user: userId }
    });
  }
  const created = toBudgetTemplateSummary(createdRaw);
  if (payload.items?.length) {
    for (const item of payload.items) {
      if (!item.productId) continue;
      try {
        await addBudgetTemplateItem(created.id, item);
      } catch {
        continue;
      }
    }
  }
  return created;
}

export async function getInsights() {
  return apiRequest<{ insights: Array<{ title: string; body: string }> }>(apiPaths.budgetInsights);
}

export async function getThreads() {
  try {
    const viewerUserId = await getCurrentUserId().catch(() => null);
    const payload = await apiRequest<unknown>(apiPaths.threads);
    const normalized = normalizeListResponse<unknown>(payload);
    return { ...normalized, data: normalized.data.map((item) => toChatUiThread(item, viewerUserId)) };
  } catch {
    const payload = await apiRequest<unknown>(apiPaths.threads);
    return normalizeListResponse<Thread>(payload);
  }
}

export async function getThread(threadId: string) {
  const parsed = decodeChatThreadId(threadId);
  if (!parsed) {
    const viewerUserId = await getCurrentUserId();
    const legacy = await apiRequest<{ thread: unknown; messages: unknown[] }>(apiPaths.threadById(threadId));
    const normalizedThread = toChatUiThread(legacy.thread, viewerUserId);
    const normalizedMessages = Array.isArray(legacy.messages)
      ? legacy.messages.map((item) => toChatUiMessage(item, viewerUserId))
      : [];
    return {
      thread: {
        ...normalizedThread,
        id: normalizedThread.id || threadId,
      },
      messages: normalizedMessages,
    };
  }

  const { shopId, userId } = parsed;
  const viewerUserId = await getCurrentUserId();
  const [threadResult, messagesResult] = await Promise.allSettled([
    apiRequest<unknown>(apiPaths.chatThreadByParticipants(shopId, userId)),
    apiRequest<unknown>(apiPaths.chatThreadMessagesByParticipants(shopId, userId))
  ]);

  const participantPayload = threadResult.status === 'fulfilled' ? threadResult.value : null;
  const participantRecord =
    participantPayload && typeof participantPayload === 'object' ? (participantPayload as Record<string, unknown>) : null;

  const threadMetaCandidateRaw =
    participantRecord?.thread && typeof participantRecord.thread === 'object'
      ? participantRecord.thread
      : participantRecord && !(Array.isArray(participantPayload))
        ? participantRecord
        : null;
  const participantThread = threadMetaCandidateRaw ? toChatUiThread(threadMetaCandidateRaw, viewerUserId) : null;

  const threadMessagesRaw = participantPayload ? normalizeListResponse<unknown>(participantPayload).data : [];
  const participantNestedMessages = participantRecord ? pickArray(participantRecord, ['messages', 'results']) : [];
  const incrementalRaw =
    messagesResult.status === 'fulfilled'
      ? Array.isArray(messagesResult.value)
        ? messagesResult.value
        : messagesResult.value && typeof messagesResult.value === 'object'
          ? [
              ...normalizeListResponse<unknown>(messagesResult.value).data,
              ...pickArray(messagesResult.value as Record<string, unknown>, ['messages', 'results'])
            ]
          : []
      : [];

  const mergedByKey = new Map<string, unknown>();
  for (const item of [...threadMessagesRaw, ...participantNestedMessages, ...incrementalRaw]) {
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
    const id = record?.id != null ? String(record.id) : '';
    const key = id || JSON.stringify([record?.created_at ?? record?.createdAt ?? record?.timestamp ?? '', record?.content ?? record?.body ?? record?.message ?? '']);
    if (!mergedByKey.has(key)) mergedByKey.set(key, item);
  }

  const messages = Array.from(mergedByKey.values())
    .map((item) => toChatUiMessage(item, viewerUserId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const inbox = await getThreads().catch(() => ({ data: [] as Thread[] }));
  const inboxMatch =
    inbox.data.find((item) => item.id === threadId) ??
    inbox.data.find((item) => item.shopId === shopId && item.otherUserId === userId);

  const inferredTitle =
    participantThread?.title && !participantThread.title.startsWith('Conversation')
      ? participantThread.title
      : messages.find((m) => m.senderName)?.senderName
        ? `Chat with ${messages.find((m) => m.senderName)?.senderName}`
        : undefined;

  const thread =
    inboxMatch ??
    (participantThread
      ? {
          ...participantThread,
          id: participantThread.id || threadId,
          title: inferredTitle ?? participantThread.title,
          lastMessage: participantThread.lastMessage ?? messages.at(-1)?.body,
          updatedAt: participantThread.updatedAt ?? messages.at(-1)?.createdAt ?? new Date().toISOString()
        }
      : {
          id: threadId,
          shopId,
          otherUserId: userId,
          title: inferredTitle ?? `Conversation ${shopId}:${userId}`,
          lastMessage: messages.at(-1)?.body,
          updatedAt: messages.at(-1)?.createdAt ?? new Date().toISOString()
        });

  return { thread, messages };
}
export async function getThreadMessages(threadId: string, afterId?: string) {
  const parsed = decodeChatThreadId(threadId);
  if (!parsed) return [] as Message[];
  const viewerUserId = await getCurrentUserId();
  const path = apiPaths.chatThreadMessagesByParticipants(parsed.shopId, parsed.userId);
  const suffix = afterId ? `?after=${encodeURIComponent(afterId)}` : '';
  let payload: unknown;
  try {
    payload = await apiRequest<unknown>(`${path}${suffix}`);
  } catch (error) {
    if (!(afterId && error instanceof ApiError && error.status === 400)) throw error;
    payload = await apiRequest<unknown>(path);
  }
  const raw =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object'
        ? [...normalizeListResponse<unknown>(payload).data, ...pickArray(payload as Record<string, unknown>, ['messages', 'results'])]
        : [];
  return raw.map((item) => toChatUiMessage(item, viewerUserId));
}
export async function sendReply(threadId: string, body: string, options?: { productId?: string }) {
  const parsed = decodeChatThreadId(threadId);
  if (!parsed) {
    const viewerUserId = await getCurrentUserId();
    const raw = await apiRequest<unknown>(apiPaths.sendReply(threadId), {
      method: 'POST',
      body: { body }
    });
    return toChatUiMessage(raw, viewerUserId);
  }
  const viewerUserId = await getCurrentUserId();
  const raw = await apiRequest<unknown>(apiPaths.chatSend, {
    method: 'POST',
    body: {
      receiver_id: parsed.userId,
      shop_id: parsed.shopId,
      ...(options?.productId ? { product_id: options.productId } : {}),
      content: body
    }
  });
  return toChatUiMessage(raw, viewerUserId);
}

export type ApiChatMessage = {
  id: string;
  shop: string | number;
  sender: string | number;
  receiver: string | number;
  content: string;
  product?: string | number | null;
  timestamp?: string;
  is_read?: boolean;
};

export async function getChatMessages() {
  const payload = await apiRequest<unknown>(apiPaths.chatMessages);
  return normalizeListResponse<ApiChatMessage>(payload);
}

export async function createChatMessage(payload: {
  shop: string | number;
  receiver: string | number;
  content: string;
  product?: string | number | null;
  sender?: string | number;
  is_read?: boolean;
}) {
  try {
    return await apiRequest<ApiChatMessage>(apiPaths.chatMessages, {
      method: 'POST',
      body: payload
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400 || payload.sender != null) throw error;
    const userId = await getCurrentUserId();
    if (userId == null) throw error;
    return apiRequest<ApiChatMessage>(apiPaths.chatMessages, {
      method: 'POST',
      body: { ...payload, sender: userId }
    });
  }
}

export async function getChatMessage(id: string) {
  return apiRequest<ApiChatMessage>(apiPaths.chatMessageById(id));
}

export async function updateChatMessage(
  id: string,
  payload: Partial<Omit<ApiChatMessage, 'id'>> & Pick<ApiChatMessage, 'shop' | 'receiver' | 'content'>
) {
  return apiRequest<ApiChatMessage>(apiPaths.chatMessageById(id), {
    method: 'PUT',
    body: payload
  });
}

export async function patchChatMessage(id: string, payload: Partial<Omit<ApiChatMessage, 'id'>>) {
  return apiRequest<ApiChatMessage>(apiPaths.chatMessageById(id), {
    method: 'PATCH',
    body: payload
  });
}

export async function deleteChatMessage(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.chatMessageById(id), { method: 'DELETE' });
}

export type ApiComment = {
  id: string;
  post?: string | number;
  user?: string | number;
  content: string;
  timestamp?: string;
  reply?: string | number | null;
};

export async function getComments() {
  const payload = await apiRequest<unknown>(apiPaths.comments);
  return normalizeListResponse<ApiComment>(payload);
}

export async function createComment(payload: { post: string | number; content: string; reply?: string | number | null }) {
  try {
    return await apiRequest<ApiComment>(apiPaths.comments, {
      method: 'POST',
      body: payload
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400) throw error;
    const userId = await getCurrentUserId();
    if (userId == null) throw error;
    return apiRequest<ApiComment>(apiPaths.comments, {
      method: 'POST',
      body: { ...payload, user: userId }
    });
  }
}

export async function getComment(id: string) {
  return apiRequest<ApiComment>(apiPaths.commentById(id));
}

export async function updateComment(
  id: string,
  payload: Partial<ApiComment> & Pick<ApiComment, 'content'>
) {
  try {
    return await apiRequest<ApiComment>(apiPaths.commentById(id), {
      method: 'PUT',
      body: payload
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400 || payload.user != null) throw error;
    const userId = await getCurrentUserId();
    if (userId == null) throw error;
    return apiRequest<ApiComment>(apiPaths.commentById(id), {
      method: 'PUT',
      body: { ...payload, user: userId }
    });
  }
}

export async function patchComment(id: string, payload: Partial<ApiComment>) {
  return apiRequest<ApiComment>(apiPaths.commentById(id), {
    method: 'PATCH',
    body: payload
  });
}

export async function deleteComment(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.commentById(id), { method: 'DELETE' });
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

export async function getUserOrders() {
  const payload = await requestWithFallback<unknown>([apiPaths.myOrders, apiPaths.adminOrders]);
  return normalizeListResponse<{ id: string; customer: string; total: number; status: string }>(payload);
}

export async function subscribeShop(shopId: string) {
  return apiRequest<ShopSubscription>(apiPaths.shopSubscriptions, { method: 'POST', body: { shop: shopId } });
}

export async function submitReview(postId: string, payload: { rating: number; body: string }) {
  return apiRequest(apiPaths.submitReview(postId), { method: 'POST', body: payload });
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

export async function getFoodcreateCategories() {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateCategories);
  return normalizeListResponse<unknown>(payload);
}

export async function createFoodcreateCategory(payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateCategories, { method: 'POST', body: payload });
}

export async function getFoodcreateCategory(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateCategoryById(id));
}

export async function updateFoodcreateCategory(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateCategoryById(id), { method: 'PUT', body: payload });
}

export async function patchFoodcreateCategory(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateCategoryById(id), { method: 'PATCH', body: payload });
}

export async function deleteFoodcreateCategory(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateCategoryById(id), { method: 'DELETE' });
}

export async function getFoodcreateSubCategories(params?: { category?: string }) {
  const q = params?.category ? `?category=${encodeURIComponent(params.category)}` : '';
  const payload = await apiRequest<unknown>(`${apiPaths.foodcreateSubCategories}${q}`);
  return normalizeListResponse<unknown>(payload);
}

export async function createFoodcreateSubCategory(payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateSubCategories, { method: 'POST', body: payload });
}

export async function getFoodcreateSubCategory(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateSubCategoryById(id));
}

export async function updateFoodcreateSubCategory(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateSubCategoryById(id), { method: 'PUT', body: payload });
}

export async function patchFoodcreateSubCategory(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateSubCategoryById(id), { method: 'PATCH', body: payload });
}

export async function deleteFoodcreateSubCategory(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateSubCategoryById(id), { method: 'DELETE' });
}

export async function getFoodcreateProducts() {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateProducts);
  const normalized = normalizeListResponse<unknown>(payload);
  return { ...normalized, data: normalized.data.map(toProduct) };
}

export async function getFoodcreateProduct(id: string) {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateProductById(id));
  return toProduct(payload);
}

export async function updateFoodcreateProduct(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateProductById(id), { method: 'PUT', body: payload });
}

export async function patchFoodcreateProduct(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateProductById(id), { method: 'PATCH', body: payload });
}

export async function deleteFoodcreateProduct(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateProductById(id), { method: 'DELETE' });
}

export async function duplicateFoodcreateProduct(id: string) {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateProductDuplicate(id), { method: 'POST' });
  return toProduct(payload);
}

export async function loadFoodcreateSubcategories(categoryId?: string) {
  const queryCandidates = categoryId
    ? [
        `?category=${encodeURIComponent(categoryId)}`,
        `?category_id=${encodeURIComponent(categoryId)}`,
        `?id=${encodeURIComponent(categoryId)}`,
      ]
    : [''];
  let lastError: unknown;
  for (const q of queryCandidates) {
    try {
      return await apiRequest<unknown>(`${apiPaths.foodcreateProductLoadSubcategories}${q}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Failed to load subcategories');
}

export async function lookupFoodcreateProduct(params?: { q?: string; id?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.id) search.set('id', params.id);
  const suffix = search.size ? `?${search.toString()}` : '';
  return apiRequest<unknown>(`${apiPaths.foodcreateProductLookup}${suffix}`);
}

export async function getFoodcreateProductImages() {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateProductImages);
  return normalizeListResponse<unknown>(payload);
}

export async function createFoodcreateProductImage(formData: FormData) {
  return formDataRequest<unknown>(apiPaths.foodcreateProductImages, formData, 'POST');
}

export async function getFoodcreateProductImage(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateProductImageById(id));
}

export async function updateFoodcreateProductImage(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateProductImageById(id), { method: 'PUT', body: payload });
}

export async function patchFoodcreateProductImage(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateProductImageById(id), { method: 'PATCH', body: payload });
}

export async function deleteFoodcreateProductImage(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateProductImageById(id), { method: 'DELETE' });
}

export async function getFoodcreateReviewRatings() {
  const payload = await apiRequest<unknown>(apiPaths.foodcreateReviewRatings);
  return normalizeListResponse<unknown>(payload);
}

export async function createFoodcreateReviewRating(payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateReviewRatings, { method: 'POST', body: payload });
}

export async function getFoodcreateReviewRating(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateReviewRatingById(id));
}

export async function updateFoodcreateReviewRating(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateReviewRatingById(id), { method: 'PUT', body: payload });
}

export async function patchFoodcreateReviewRating(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.foodcreateReviewRatingById(id), { method: 'PATCH', body: payload });
}

export async function deleteFoodcreateReviewRating(id: string) {
  return apiRequest<unknown>(apiPaths.foodcreateReviewRatingById(id), { method: 'DELETE' });
}

export async function getShopProducts(shopId: string) {
  try {
    const payload = await requestWithFallback<unknown>([
      `/account/shops/${shopId}/products/`,
      `/home/shops/${shopId}/products/`,
    ]);
    const normalized = normalizeListResponse<unknown>(payload);
    return { ...normalized, data: normalized.data.map(toProduct) };
  } catch {
    const all = await getProducts().catch(() => ({ data: [] as Product[] }));
    const filtered = all.data.filter((p) => p.shopId === shopId);
    return { data: filtered, count: filtered.length };
  }
}

export async function getShopReviews(shopId: string): Promise<ShopReview[]> {
  try {
    const payload = await apiRequest<unknown>(`/account/shops/${shopId}/reviews/`);
    const normalized = normalizeListResponse<unknown>(payload);
    return normalized.data.map(toReview);
  } catch {
    return [];
  }
}

export async function getSimilarShops(shopId: string): Promise<Shop[]> {
  try {
    const payload = await apiRequest<unknown>(`/account/shops/${shopId}/similar/`);
    const normalized = normalizeListResponse<unknown>(payload);
    return normalized.data.map(toShop);
  } catch {
    return [];
  }
}

// ---- Auth helpers ----

function authFetch(path: string, body: unknown, token?: string) {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export type AuthTokens = { access: string; refresh: string };
export type MeResponse = {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: 'pending' | 'customer' | 'shop' | 'dispatcher';
  is_active: boolean;
};

/**
 * Returns a map of fieldName -> first error string extracted from a DRF response.
 * Exported so UI components can highlight specific fields.
 */
export function extractDRFFieldErrors(data: unknown): Record<string, string> {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const errors: Record<string, string> = {};

  // Unwrap {error: {detail: {...}}} or use root directly
  const root = (d.error && typeof d.error === 'object' && !Array.isArray(d.error))
    ? (d.error as Record<string, unknown>)
    : d;

  const scan = (obj: Record<string, unknown>) => {
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
        if (!errors[key]) errors[key] = val[0];
      }
    }
  };

  if (root.detail && typeof root.detail === 'object' && !Array.isArray(root.detail)) {
    scan(root.detail as Record<string, unknown>);
  }
  scan(root);
  return errors;
}

export async function authCheckEmail(email: string): Promise<{ available: boolean; detail?: string }> {
  const res = await authFetch('/auth/check-email/', { email });
  const data = await res.json().catch(() => ({})) as { available?: boolean; detail?: string };
  return { available: data.available ?? true, detail: data.detail };
}

export async function authLogin(email: string, password: string): Promise<AuthTokens> {
  const res = await authFetch('/auth/login/', { email, password });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = '';
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      // Unwrap {error: {detail: {...}}} wrapper the backend uses
      const root = (d.error && typeof d.error === 'object' && !Array.isArray(d.error))
        ? (d.error as Record<string, unknown>)
        : d;
      const detail = root.detail;
      if (typeof detail === 'string' && detail.trim()) {
        msg = detail.trim();
      } else if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        for (const val of Object.values(detail as Record<string, unknown>)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') { msg = val[0]; break; }
          if (typeof val === 'string' && val.trim()) { msg = val.trim(); break; }
        }
      }
      if (!msg) {
        for (const val of Object.values(root)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') { msg = val[0]; break; }
        }
      }
    }
    if (!msg) msg = 'Login failed.';
    if (msg.toLowerCase().includes('no active account')) msg = 'Invalid email or password. Please try again.';
    throw new ApiError(msg, res.status, data);
  }
  return data as AuthTokens;
}

export async function authRegister(payload: {
  email: string;
  password: string;
}): Promise<{ detail: string }> {
  const res = await authFetch('/auth/register/', payload);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Inline extraction so the call stack is easy to trace
    let msg = '';
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      // Unwrap {error: {detail: {...}}} wrapper the backend uses
      const root = (d.error && typeof d.error === 'object' && !Array.isArray(d.error))
        ? (d.error as Record<string, unknown>)
        : d;
      const detail = root.detail;
      if (typeof detail === 'string' && detail.trim()) {
        msg = detail.trim();
      } else if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        for (const val of Object.values(detail as Record<string, unknown>)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') { msg = val[0]; break; }
        }
      }
      if (!msg) {
        for (const val of Object.values(root)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') { msg = val[0]; break; }
        }
      }
    }
    throw new ApiError(msg || 'Registration failed. Please try again.', res.status, data);
  }
  return data as { detail: string };
}

export async function authLogout(refreshToken: string): Promise<void> {
  await authFetch('/auth/logout/', { refresh: refreshToken }).catch(() => null);
}

export async function authMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${BASE_URL}/auth/me/`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.detail || 'Failed to get user.', res.status, data);
  return data as MeResponse;
}

export async function authPasswordReset(email: string): Promise<{ detail: string }> {
  const res = await authFetch('/auth/password-reset/', { email });
  const data = await res.json();
  // Always 200 from backend regardless of whether email exists
  return data as { detail: string };
}

export async function authPasswordResetConfirm(
  uidb64: string,
  token: string,
  newPassword: string,
): Promise<{ detail: string }> {
  const res = await authFetch(`/auth/password-reset-confirm/${uidb64}/${token}/`, { new_password: newPassword });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.detail || 'Password reset failed.', res.status, data);
  return data as { detail: string };
}

export async function authPasswordChange(
  oldPassword: string,
  newPassword: string,
  accessToken: string,
): Promise<{ detail: string }> {
  const res = await authFetch('/auth/password-change/', { old_password: oldPassword, new_password: newPassword }, accessToken);
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.detail || 'Password change failed.', res.status, data);
  return data as { detail: string };
}

export async function authChooseRole(role: 'customer' | 'shop' | 'dispatcher'): Promise<MeResponse> {
  const payload = await apiRequest<MeResponse>('/auth/choose-role/', { method: 'POST', body: { role } });
  return payload;
}

export async function authRefreshToken(refreshToken: string): Promise<{ access: string }> {
  const res = await authFetch('/auth/token/refresh/', { refresh: refreshToken });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.detail || 'Session expired.', res.status, data);
  return data as { access: string };
}

export async function authSocialLogin(
  provider: 'google' | 'facebook' | 'twitter',
  accessToken: string,
): Promise<AuthTokens> {
  const res = await authFetch('/auth/social/login/', { provider, access_token: accessToken });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.detail || 'Social login failed.', res.status, data);
  return data as AuthTokens;
}

export async function authShopInfo(formData: FormData): Promise<void> {
  return formDataRequest('/auth/shop/info/', formData);
}

export async function authShopAddress(payload: {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}): Promise<void> {
  await apiRequest('/auth/shop/address/', { method: 'POST', body: payload });
}

export async function authShopDocs(formData: FormData): Promise<void> {
  return formDataRequest('/auth/shop/docs/', formData);
}

export async function authShopPlan(planId: string): Promise<void> {
  await apiRequest('/auth/shop/plan/', { method: 'POST', body: { plan: planId } });
}

export async function authActivate(uidb64: string, token: string): Promise<{ detail: string }> {
  const res = await authFetch(`/auth/activate/${uidb64}/${token}/`, {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { detail?: string }).detail || 'Activation failed or link has expired.', res.status, data);
  const d = data as { access?: string; refresh?: string; detail: string };
  if (d.access) document.cookie = `access_token=${encodeURIComponent(d.access)}; Max-Age=86400; path=/; SameSite=Lax`;
  if (d.refresh) document.cookie = `refresh_token=${encodeURIComponent(d.refresh)}; Max-Age=${30 * 86400}; path=/; SameSite=Lax`;
  // New accounts always start with pending role; set the cookie so middleware can enforce choose-role
  document.cookie = `role=pending; Max-Age=86400; path=/; SameSite=Lax`;
  return data as { detail: string };
}

export async function authCustomerSetup(payload: {
  phone: string;
  address: string;
  city: string;
  postal_code?: string;
}): Promise<void> {
  await apiRequest('/auth/customer/setup/', { method: 'POST', body: payload });
}

export async function authDispatcherPersonal(formData: FormData): Promise<void> {
  return formDataRequest('/auth/dispatcher/personal/', formData);
}

export async function authDispatcherVehicle(formData: FormData): Promise<void> {
  return formDataRequest('/auth/dispatcher/vehicle/', formData);
}

// ---- Customer Profiles ----

function extractFirst<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as T) ?? null;
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.results)) return (r.results[0] as T) ?? null;
  if (Array.isArray(r.data)) return (r.data[0] as T) ?? null;
  return raw as T;
}

export async function getMyProfile(): Promise<CustomerProfile | null> {
  try {
    const raw = await apiRequest<unknown>('/account/profiles/');
    return extractFirst<CustomerProfile>(raw);
  } catch {
    return null;
  }
}

export async function createProfile(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
  return apiRequest<CustomerProfile>('/account/profiles/', { method: 'POST', body: payload });
}

export async function patchProfile(id: string, payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
  return apiRequest<CustomerProfile>(`/account/profiles/${id}/`, { method: 'PATCH', body: payload });
}

export async function updateProfile(id: string, payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
  return apiRequest<CustomerProfile>(`/account/profiles/${id}/`, { method: 'PUT', body: payload });
}

export async function deleteProfile(id: string): Promise<void> {
  await apiRequest<void>(`/account/profiles/${id}/`, { method: 'DELETE' });
}

// ---- Dispatcher Profiles ----

export async function getMyDispatcherProfile(): Promise<DispatcherProfile | null> {
  try {
    const raw = await apiRequest<unknown>('/account/dispatcher-profiles/');
    return extractFirst<DispatcherProfile>(raw);
  } catch {
    return null;
  }
}

export async function createDispatcherProfile(formData: FormData): Promise<DispatcherProfile> {
  return formDataRequest<DispatcherProfile>('/account/dispatcher-profiles/', formData);
}

export async function patchDispatcherProfileForm(id: string, formData: FormData): Promise<DispatcherProfile> {
  return formDataRequest<DispatcherProfile>(`/account/dispatcher-profiles/${id}/`, formData, 'PATCH');
}

export async function patchDispatcherProfile(id: string, payload: Partial<DispatcherProfile>): Promise<DispatcherProfile> {
  return apiRequest<DispatcherProfile>(`/account/dispatcher-profiles/${id}/`, { method: 'PATCH', body: payload });
}

export async function deleteDispatcherProfile(id: string): Promise<void> {
  await apiRequest<void>(`/account/dispatcher-profiles/${id}/`, { method: 'DELETE' });
}

// ---- Shop Followers ----

export async function getShopFollowers(): Promise<ShopFollower[]> {
  try {
    const raw = await apiRequest<unknown>('/account/shop-followers/');
    return normalizeListResponse<ShopFollower>(raw).data;
  } catch {
    return [];
  }
}

export async function followShop(shopId: string): Promise<ShopFollower> {
  return apiRequest<ShopFollower>('/account/shop-followers/', { method: 'POST', body: { shop: shopId } });
}

export async function unfollowShop(id: string): Promise<void> {
  await apiRequest<void>(`/account/shop-followers/${id}/`, { method: 'DELETE' });
}

// ---- Shop Integrations ----

export async function getShopIntegrations(): Promise<ShopIntegration[]> {
  try {
    const raw = await apiRequest<unknown>('/account/shop-integrations/');
    return normalizeListResponse<ShopIntegration>(raw).data;
  } catch {
    return [];
  }
}

export async function createIntegration(payload: Partial<ShopIntegration>): Promise<ShopIntegration> {
  return apiRequest<ShopIntegration>('/account/shop-integrations/', { method: 'POST', body: payload });
}

export async function patchIntegration(id: string, payload: Partial<ShopIntegration>): Promise<ShopIntegration> {
  return apiRequest<ShopIntegration>(`/account/shop-integrations/${id}/`, { method: 'PATCH', body: payload });
}

export async function deleteIntegration(id: string): Promise<void> {
  await apiRequest<void>(`/account/shop-integrations/${id}/`, { method: 'DELETE' });
}

// ---- Shop Subscriptions ----

export async function getShopSubscriptions(): Promise<ShopSubscription[]> {
  try {
    const raw = await apiRequest<unknown>(apiPaths.shopSubscriptions);
    return normalizeListResponse<ShopSubscription>(raw).data;
  } catch {
    return [];
  }
}

export async function getShopSubscription(id: string): Promise<ShopSubscription> {
  return apiRequest<ShopSubscription>(apiPaths.shopSubscriptionById(id));
}

export async function createShopSubscription(shopId: string): Promise<ShopSubscription> {
  return apiRequest<ShopSubscription>(apiPaths.shopSubscriptions, { method: 'POST', body: { shop: shopId } });
}

export async function updateShopSubscription(id: string, payload: Partial<ShopSubscription>): Promise<ShopSubscription> {
  return apiRequest<ShopSubscription>(apiPaths.shopSubscriptionById(id), { method: 'PUT', body: payload });
}

export async function patchShopSubscription(id: string, payload: Partial<ShopSubscription>): Promise<ShopSubscription> {
  return apiRequest<ShopSubscription>(apiPaths.shopSubscriptionById(id), { method: 'PATCH', body: payload });
}

export async function deleteShopSubscription(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.shopSubscriptionById(id), { method: 'DELETE' });
}

// ---- Shop Notifications ----

export async function getShopNotifications(): Promise<ShopNotification[]> {
  try {
    const raw = await requestWithFallback<unknown>([
      apiPaths.shopNotifications,
      apiPaths.homeShopNotifications,
      apiPaths.wishlistNotifications,
    ]);
    return normalizeListResponse<ShopNotification>(raw).data;
  } catch {
    return [];
  }
}

export async function getShopNotification(id: string): Promise<ShopNotification> {
  let lastError: unknown;
  for (const path of [apiPaths.shopNotificationById(id), apiPaths.wishlistNotificationById(id)]) {
    try {
      return await apiRequest<ShopNotification>(path);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Notification not found');
}

export async function markNotificationRead(id: string): Promise<ShopNotification> {
  let lastError: unknown;
  for (const path of [apiPaths.shopNotificationById(id), apiPaths.wishlistNotificationById(id)]) {
    try {
      return await apiRequest<ShopNotification>(path, { method: 'PATCH', body: { is_read: true } });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  throw lastError ?? new Error('Unable to mark notification read');
}

export async function markAllNotificationsRead(notifications: ShopNotification[]): Promise<void> {
  await Promise.allSettled(
    notifications.filter((n) => !n.is_read).map((n) => markNotificationRead(n.id))
  );
}

export async function deleteShopNotification(id: string): Promise<void> {
  let lastError: unknown;
  for (const path of [apiPaths.shopNotificationById(id), apiPaths.wishlistNotificationById(id)]) {
    try {
      await apiRequest<void>(path, { method: 'DELETE' });
      return;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 404) continue;
      throw error;
    }
  }
  if (lastError) throw lastError;
}

export async function getWishlistNotifications() {
  const raw = await apiRequest<unknown>(apiPaths.wishlistNotifications);
  return normalizeListResponse<unknown>(raw);
}

export async function createWishlistNotification(payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistNotifications, { method: 'POST', body: payload });
}

export async function getWishlistNotification(id: string) {
  return apiRequest<unknown>(apiPaths.wishlistNotificationById(id));
}

export async function updateWishlistNotification(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistNotificationById(id), { method: 'PUT', body: payload });
}

export async function patchWishlistNotification(id: string, payload: Record<string, unknown>) {
  return apiRequest<unknown>(apiPaths.wishlistNotificationById(id), { method: 'PATCH', body: payload });
}

export async function deleteWishlistNotification(id: string) {
  return apiRequest<unknown>(apiPaths.wishlistNotificationById(id), { method: 'DELETE' });
}

// ---- Admin Shop CRUD ----

export async function createAdminShop(payload: Partial<Shop>): Promise<Shop> {
  const raw = await apiRequest<unknown>(apiPaths.shops, { method: 'POST', body: payload });
  return toShop(raw);
}

export async function updateAdminShop(id: string, payload: Partial<Shop>): Promise<Shop> {
  const raw = await apiRequest<unknown>(apiPaths.shopById(id), { method: 'PUT', body: payload });
  return toShop(raw);
}

export async function patchAdminShop(id: string, payload: Partial<Shop>): Promise<Shop> {
  const raw = await apiRequest<unknown>(apiPaths.shopById(id), { method: 'PATCH', body: payload });
  return toShop(raw);
}

export async function deleteAdminShop(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.shopById(id), { method: 'DELETE' });
}

// ---- Subscription Plans ----

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const raw = await apiRequest<unknown>(apiPaths.subscriptionPlans);
    return normalizeListResponse<SubscriptionPlan>(raw).data;
  } catch {
    return [];
  }
}

export async function getSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(apiPaths.subscriptionPlanById(id));
}

export async function createSubscriptionPlan(payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(apiPaths.subscriptionPlans, { method: 'POST', body: payload });
}

export async function updateSubscriptionPlan(id: string, payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(apiPaths.subscriptionPlanById(id), { method: 'PUT', body: payload });
}

export async function patchSubscriptionPlan(id: string, payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(apiPaths.subscriptionPlanById(id), { method: 'PATCH', body: payload });
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.subscriptionPlanById(id), { method: 'DELETE' });
}

// ---- Admin Users ----

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const raw = await apiRequest<unknown>(apiPaths.adminUsers);
    return normalizeListResponse<AdminUser>(raw).data;
  } catch {
    return [];
  }
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(apiPaths.adminUserById(id));
}

export async function createAdminUser(payload: Partial<AdminUser>): Promise<AdminUser> {
  return apiRequest<AdminUser>(apiPaths.adminUsers, { method: 'POST', body: payload });
}

export async function patchAdminUser(id: string, payload: Partial<AdminUser>): Promise<AdminUser> {
  return apiRequest<AdminUser>(apiPaths.adminUserById(id), { method: 'PATCH', body: payload });
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiRequest<void>(apiPaths.adminUserById(id), { method: 'DELETE' });
}
