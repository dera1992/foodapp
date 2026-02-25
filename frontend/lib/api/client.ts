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

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

// Attempt to refresh the access token using the stored refresh token (client-side only).
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )refresh_token=([^;]*)/);
  if (!match) return null;
  const refreshToken = decodeURIComponent(match[1]);
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess = data.access as string | undefined;
    if (!newAccess) return null;
    document.cookie = `access_token=${encodeURIComponent(newAccess)}; Max-Age=86400; path=/; SameSite=Lax`;
    return newAccess;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    // Server context — read from next/headers cookies
    try {
      const { cookies } = await import('next/headers');
      const store = await cookies();
      return store.get('access_token')?.value ?? null;
    } catch {
      return null;
    }
  }
  // Client context — read from document.cookie
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, cache = 'no-store', next } = options;

  const token = await getAccessToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    cache,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(headers as Record<string, string>),
    },
    body: body ? JSON.stringify(body) : undefined,
    next,
  });

  // Auto-refresh on 401 (client-side only) then retry once
  if (response.status === 401 && typeof window !== 'undefined') {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${BASE_URL}${path}`, {
        method,
        cache,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...(headers as Record<string, string>),
        },
        body: body ? JSON.stringify(body) : undefined,
        next,
      });
      const retryContentType = retryResponse.headers.get('content-type') ?? '';
      const retryPayload = retryContentType.includes('application/json') ? await retryResponse.json() : null;
      if (!retryResponse.ok) {
        const retryMsg = retryPayload?.detail || retryPayload?.message || `API request failed with status ${retryResponse.status}`;
        throw new ApiError(retryMsg, retryResponse.status, retryPayload);
      }
      return retryPayload as T;
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.detail || payload?.message || `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

/**
 * Send a FormData payload with JWT auth and automatic token-refresh retry on 401.
 * Supports POST and PATCH. Generic T controls the return type (defaults to void).
 */
export async function formDataRequest<T = void>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

  let token = await getAccessToken();
  let response = await doFetch(token);

  if (response.status === 401 && typeof window !== 'undefined') {
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload as Record<string, unknown>)?.detail as string ||
      `Request failed with status ${response.status}`;
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
