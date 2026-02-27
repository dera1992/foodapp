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
const API_ROOT_URL = BASE_URL.replace(/\/api\/v1\/?$/, '');

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

// Attempt to refresh the access token using the stored refresh token.
// Works on both client (reads document.cookie) and server (reads next/headers cookies).
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    // Server context — read refresh token from next/headers cookies and call backend directly
    try {
      const { cookies } = await import('next/headers');
      const store = await cookies();
      const refreshToken = store.get('refresh_token')?.value;
      if (!refreshToken) return null;
      const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.access as string) ?? null;
      // Note: the middleware already handles persisting the new cookie for the next request.
      // Here we just return the token so the current server render can retry successfully.
    } catch {
      return null;
    }
  }

  // Client context — read from document.cookie and persist the new token
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

async function getServerCookieHeader(): Promise<string | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const all = store.getAll();
    if (!all.length) return null;
    return all.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, cache = 'no-store', next } = options;
  const requestUrl =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : path.startsWith('/api/')
        ? `${API_ROOT_URL}${path}`
        : `${BASE_URL}${path}`;

  const token = await getAccessToken();
  const serverCookieHeader = await getServerCookieHeader();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const cookieHeader: Record<string, string> = serverCookieHeader ? { Cookie: serverCookieHeader } : {};

  const response = await fetch(requestUrl, {
    method,
    cache,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...cookieHeader,
      ...(headers as Record<string, string>),
    },
    body: body ? JSON.stringify(body) : undefined,
    next,
  });

  // Auto-refresh on 401 (client + server) then retry once
  if (response.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryResponse = await fetch(requestUrl, {
        method,
        cache,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...cookieHeader,
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

  if (response.status === 401) {
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
