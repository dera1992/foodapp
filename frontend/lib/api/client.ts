import type { ApiListResponse, AdminAnalytics, BudgetSummary, Cart, CustomerAnalytics, Message, Product, Shop, Thread } from '@/types/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, cache = 'no-store', next } = options;
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    cache,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    next
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.detail || payload?.message || `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export type ApiTypes = {
  Shop: Shop;
  Product: Product;
  Cart: Cart;
  CustomerAnalytics: CustomerAnalytics;
  Thread: Thread;
  Message: Message;
  BudgetSummary: BudgetSummary;
  AdminAnalytics: AdminAnalytics;
  ListShops: ApiListResponse<Shop>;
  ListProducts: ApiListResponse<Product>;
};
