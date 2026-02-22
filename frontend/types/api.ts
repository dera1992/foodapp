export type ApiListResponse<T> = {
  data: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

export type Shop = {
  id: string;
  name: string;
  image?: string | null;
  address?: string;
  city?: string;
  distanceKm?: number | null;
  rating?: number | null;
  productsCount?: number;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  image?: string | null;
  gallery?: string[];
  category?: string;
  price: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  shopId?: string;
  shopName?: string;
  expiresOn?: string | null;
  status?: string | null;
  delivery?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  categories?: string[];
};

export type CartItem = {
  id?: string;
  productId: string;
  name: string;
  shopName?: string;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  savings?: number;
};

export type Cart = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  savings: number;
  total: number;
  couponCode?: string;
};

export type OrderSummary = {
  orderId?: string;
  ref?: string;
  items: number;
  total: number;
};

export type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
};

export type CustomerAnalytics = {
  totalSpend: number;
  totalOrders: number;
  averageOrderValue: number;
  wishlistCount: number;
  alertsCount?: number;
  itemsBought?: number;
  topCategories: Array<{ name: string; quantity: number }>;
  subscribedShops: Shop[];
  recentOrders: Order[];
};

export type TrendValue = {
  direction: 'up' | 'down';
  percent: number;
};

export type CustomerAnalyticsDashboard = {
  totalSpend: number;
  totalOrders: number;
  avgOrderValue: number;
  wishlistCount: number;
  alertsCount: number;
  itemsBought: number;
  topCategories: Array<{ name: string; quantity: number; percent: number }>;
  favouriteShops: Array<{ id?: string; name: string; location?: string; orders: number }>;
  subscribedShops: Array<{ id: string; name: string; city?: string; subscribed: boolean }>;
  recentOrders: Array<{ id: string; ref?: string; total: number; date?: string; status: 'completed' | 'pending' | 'cancelled' }>;
  trends?: Partial<Record<'totalSpend' | 'totalOrders' | 'wishlistCount' | 'itemsBought', TrendValue>>;
};

export type ShopAnalyticsDashboard = {
  identity: {
    shopName: string;
    address?: string;
    followerCount: number;
    avgRating: number;
    reviewCount: number;
  };
  totalRevenue: number;
  totalOrders: number;
  itemsSold: number;
  avgOrderValue: number;
  uniqueBuyers: number;
  lowStockCount: number;
  topSellingItems: Array<{ name: string; units: number }>;
  customerDemographics: Array<{ city: string; customers: number; percent: number }>;
  inventory: {
    lowStock: Array<{ name: string; stock?: number }>;
    popular: Array<{ name: string; sold: number }>;
    slowMovers: Array<{ name: string; lastSoldDays?: number }>;
  };
  subscription: {
    currentPlan?: string;
    active: boolean;
    daysLeft?: number;
    upgrades: Array<{ name: string; price: number; productLimit?: number }>;
  };
};

export type Thread = {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number;
};

export type Message = {
  id: string;
  senderName: string;
  senderId: string;
  body: string;
  createdAt: string;
  isMine?: boolean;
};

export type BudgetInsight = {
  title: string;
  body: string;
};

export type BudgetItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

export type BudgetSummary = {
  id: string;
  name: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  items: BudgetItem[];
  insights?: BudgetInsight[];
};

export type AdminAnalytics = {
  followers: number;
  averageRating: number;
  reviewCount: number;
  revenue: number;
  orders: number;
  lowStockCount: number;
};
