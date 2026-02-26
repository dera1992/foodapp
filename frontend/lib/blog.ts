export type BlogComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
  emoji: string | null;
  category: string;
  categorySlug: string;
  author: string;
  createdAt: string;
  readTime: number;
  comments?: BlogComment[];
};

export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

export type BlogCategoryCount = {
  name: string;
  slug: string;
  total: number;
};

export type BlogCategoryApiPayload = {
  id?: number;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type BlogPostApiPayload = {
  id?: number;
  title?: string;
  slug?: string;
  content?: string | null;
  categories?: Array<number | string> | number[];
  publish?: string;
  read_time?: number;
  draft?: boolean;
  image?: unknown;
  [key: string]: unknown;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';
const API_V1 = `${API_BASE.replace(/\/$/, '')}/v1/blog`;
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return '';
  }
})();

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

function pickNestedString(record: Record<string, unknown>, nestedKeys: string[], keys: string[]): string {
  for (const nestedKey of nestedKeys) {
    const nested = toRecord(record[nestedKey]);
    const value = pickString(nested, keys);
    if (value) return value;
  }
  return '';
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildExcerpt(content: string, fallback = 'Read the latest update from bunchfood.'): string {
  const text = stripHtml(content);
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

function normalizeImageUrl(value: string): string {
  if (!value) return value;
  if (/^(https?:)?\/\//i.test(value) || /^data:/i.test(value)) return value;
  if (!API_ORIGIN) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
}

type CategoryLookupValue = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

function parseCountMap(countsList: unknown[]) {
  const countMap = new Map<string, number>();
  for (const item of countsList) {
    const rec = toRecord(item);
    const name = pickString(rec, ['name', 'category', 'title', 'categories__title']);
    const slug = pickString(rec, ['slug']) || (name ? slugify(name) : '');
    const count = pickNumber(rec, ['postCount', 'post_count', 'count', 'total']);
    if (slug) countMap.set(slug, count);
  }
  return countMap;
}

function parseCategories(categoriesList: unknown[], countMap?: Map<string, number>) {
  return categoriesList.map((item, index) => {
    const record = toRecord(item);
    const name = pickString(record, ['name', 'category', 'title']) || `Category ${index + 1}`;
    const slug = pickString(record, ['slug']) || slugify(name);
    return {
      id: Number(pickString(record, ['id']) || index + 1),
      name,
      slug,
      postCount: (countMap?.get(slug) ?? pickNumber(record, ['postCount', 'post_count', 'count', 'total'])) || 0
    } satisfies BlogCategory;
  });
}

async function fetchCategoriesPayload() {
  return tryRequest([v1Path('/categorys/'), '/api/blog/categories/', backendPath('/blog/categories/')]);
}

async function fetchCategoryCountsPayload() {
  return tryRequest([v1Path('/category-count/')]);
}

async function getCategoryLookup() {
  try {
    const categoriesPayload = await fetchCategoriesPayload();
    const categories = parseCategories(normalizeListPayload(categoriesPayload));
    return new Map<number, CategoryLookupValue>(categories.map((category) => [category.id, category]));
  } catch {
    return new Map<number, CategoryLookupValue>();
  }
}

function mapComment(raw: unknown, index: number): BlogComment {
  const record = toRecord(raw);
  return {
    id: pickString(record, ['id']) || `comment-${index + 1}`,
    author: pickString(record, ['author', 'name', 'user_name']) || 'Guest',
    body: pickString(record, ['body', 'comment', 'content']) || '',
    createdAt: pickString(record, ['created_at', 'createdAt', 'date']) || new Date().toISOString()
  };
}

function mapPost(raw: unknown, index: number, categoryLookup?: Map<number, CategoryLookupValue>): BlogPost {
  const record = toRecord(raw);
  const categoryRecord = toRecord(record.category);
  const authorRecord = toRecord(record.author);
  const title = pickString(record, ['title', 'name']) || `Blog Post ${index + 1}`;
  const content = pickString(record, ['content', 'body']) || '<p>Post content is not available yet.</p>';
  const commentsRaw = Array.isArray(record.comments) ? record.comments : [];
  const categoriesRaw = Array.isArray(record.categories) ? record.categories : [];

  let category = pickString(record, ['category_name']) || pickNestedString(record, ['category'], ['name', 'title']);
  let categorySlug = pickString(record, ['category_slug']) || pickNestedString(record, ['category'], ['slug']);

  if ((!category || !categorySlug) && categoriesRaw.length) {
    for (const item of categoriesRaw) {
      if (typeof item === 'number' || typeof item === 'string') {
        const numericId = typeof item === 'number' ? item : Number.parseInt(item, 10);
        if (Number.isFinite(numericId) && categoryLookup?.has(numericId)) {
          const resolved = categoryLookup.get(numericId)!;
          category ||= resolved.name;
          categorySlug ||= resolved.slug;
          break;
        }
        if (typeof item === 'string' && item.trim() && Number.isNaN(Number(item))) {
          category ||= item.trim();
          categorySlug ||= slugify(item.trim());
          break;
        }
      }
      const categoryItem = toRecord(item);
      const itemName = pickString(categoryItem, ['name', 'title']);
      const itemSlug = pickString(categoryItem, ['slug']) || (itemName ? slugify(itemName) : '');
      if (itemName || itemSlug) {
        category ||= itemName;
        categorySlug ||= itemSlug;
        break;
      }
    }
  }

  category ||= pickString(record, ['category']) || 'General';
  categorySlug ||= slugify(category);

  return {
    id: Number(pickString(record, ['id']) || index + 1),
    slug: pickString(record, ['slug']) || slugify(title),
    title,
    excerpt: pickString(record, ['excerpt', 'summary']) || buildExcerpt(content),
    content,
    image: (() => {
      const imageValue = pickString(record, ['image', 'thumbnail', 'featured_image']);
      return imageValue ? normalizeImageUrl(imageValue) : null;
    })(),
    emoji: pickString(record, ['emoji']) || null,
    category,
    categorySlug,
    author:
      pickString(record, ['author_name']) ||
      pickString(authorRecord, ['full_name', 'name', 'username']) ||
      pickString(record, ['author']) ||
      'Bunchfood Team',
    createdAt: pickString(record, ['createdAt', 'created_at', 'published_at', 'timestamp', 'publish']) || new Date().toISOString(),
    readTime: pickNumber(record, ['readTime', 'read_time']) || 3,
    comments: commentsRaw.map(mapComment)
  };
}

function normalizeListPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = toRecord(payload);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store', credentials: 'include' });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))?.split('=')
      .slice(1)
      .join('=') ?? ''
  );
}

async function requestJson<T = unknown>(
  url: string,
  init?: Omit<RequestInit, 'body'> & { body?: BodyInit | Record<string, unknown> | null }
): Promise<T> {
  const csrf = getCsrfToken();
  const body = init?.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isJsonObject = !!body && typeof body === 'object' && !isFormData && !(body instanceof URLSearchParams);

  const headers = new Headers(init?.headers);
  if (csrf) headers.set('X-CSRFToken', decodeURIComponent(csrf));
  if (isJsonObject && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    cache: init?.method && init.method !== 'GET' ? 'no-store' : init?.cache ?? 'no-store',
    headers,
    body: isJsonObject ? JSON.stringify(body) : (body as BodyInit | null | undefined),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  if (response.status === 204) return null as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null as T;
  }
  return (await response.json()) as T;
}

async function tryRequest(paths: string[]) {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await fetchJson(path);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Request failed');
}

function backendPath(path: string) {
  return `${API_BASE}${path}`;
}

function v1Path(path: string) {
  return `${API_V1}${path}`;
}

function mapCategoryCount(raw: unknown): BlogCategoryCount {
  const record = toRecord(raw);
  const name = pickString(record, ['name', 'category', 'title', 'categories__title']) || 'General';
  return {
    name,
    slug: pickString(record, ['slug']) || slugify(name),
    total: pickNumber(record, ['total', 'count', 'postCount', 'post_count']) || 0
  };
}

export async function getBlogPosts(filters?: { category?: string; q?: string }) {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.q) params.set('search', filters.q);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const [payload, categoryLookup] = await Promise.all([
      tryRequest([v1Path(`/posts/${qs}`), '/api/blog/', backendPath('/blog/')]),
      getCategoryLookup()
    ]);
    const list = normalizeListPayload(payload).map((item, index) => mapPost(item, index, categoryLookup));
    return list.filter((post) => {
      const matchCategory = filters?.category ? post.categorySlug === filters.category : true;
      const q = filters?.q?.trim().toLowerCase();
      const matchQuery = q
        ? [post.title, post.excerpt, post.category, post.author].join(' ').toLowerCase().includes(q)
        : true;
      return matchCategory && matchQuery;
    });
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string) {
  try {
    const [payload, categoryLookup] = await Promise.all([
      tryRequest([v1Path(`/posts/by-slug/${slug}/`), `/api/blog/${slug}/`, backendPath(`/blog/${slug}/`)]),
      getCategoryLookup()
    ]);
    return mapPost(payload, 0, categoryLookup);
  } catch {
    return null;
  }
}

export async function getBlogCategories() {
  try {
    const [categoriesPayload, countsPayload] = await Promise.allSettled([
      fetchCategoriesPayload(),
      fetchCategoryCountsPayload()
    ]);

    const categoriesList = categoriesPayload.status === 'fulfilled' ? normalizeListPayload(categoriesPayload.value) : [];
    const countsList = countsPayload.status === 'fulfilled' ? normalizeListPayload(countsPayload.value) : [];
    const countMap = parseCountMap(countsList);
    const categories = parseCategories(categoriesList, countMap);
    if (categories.length) return categories;
  } catch {
    return [];
  }

  return [];
}

export async function getBlogCategoryCounts() {
  const payload = await fetchCategoryCountsPayload();
  return normalizeListPayload(payload).map(mapCategoryCount);
}

export async function listBlogCategoriesRaw() {
  return requestJson<BlogCategoryApiPayload[]>(v1Path('/categorys/'));
}

export async function createBlogCategory(data: BlogCategoryApiPayload) {
  return requestJson<BlogCategoryApiPayload>(v1Path('/categorys/'), {
    method: 'POST',
    body: data
  });
}

export async function getBlogCategoryById(id: number | string) {
  return requestJson<BlogCategoryApiPayload>(v1Path(`/categorys/${id}/`));
}

export async function updateBlogCategory(id: number | string, data: BlogCategoryApiPayload) {
  return requestJson<BlogCategoryApiPayload>(v1Path(`/categorys/${id}/`), {
    method: 'PUT',
    body: data
  });
}

export async function patchBlogCategory(id: number | string, data: Partial<BlogCategoryApiPayload>) {
  return requestJson<BlogCategoryApiPayload>(v1Path(`/categorys/${id}/`), {
    method: 'PATCH',
    body: data as Record<string, unknown>
  });
}

export async function deleteBlogCategory(id: number | string) {
  await requestJson<null>(v1Path(`/categorys/${id}/`), { method: 'DELETE' });
  return true;
}

export async function listBlogPostsRaw() {
  return requestJson<BlogPostApiPayload[] | { results?: BlogPostApiPayload[] }>(v1Path('/posts/'));
}

export async function createBlogPost(data: BlogPostApiPayload | FormData) {
  return requestJson<BlogPostApiPayload>(v1Path('/posts/'), {
    method: 'POST',
    body: data as BodyInit | Record<string, unknown>
  });
}

export async function getBlogPostById(id: number | string) {
  const [payload, categoryLookup] = await Promise.all([
    requestJson<unknown>(v1Path(`/posts/${id}/`)),
    getCategoryLookup()
  ]);
  return mapPost(payload, 0, categoryLookup);
}

export async function getBlogPostByIdRaw(id: number | string) {
  return requestJson<BlogPostApiPayload>(v1Path(`/posts/${id}/`));
}

export async function updateBlogPost(id: number | string, data: BlogPostApiPayload | FormData) {
  return requestJson<BlogPostApiPayload>(v1Path(`/posts/${id}/`), {
    method: 'PUT',
    body: data as BodyInit | Record<string, unknown>
  });
}

export async function patchBlogPost(id: number | string, data: Partial<BlogPostApiPayload> | FormData) {
  return requestJson<BlogPostApiPayload>(v1Path(`/posts/${id}/`), {
    method: 'PATCH',
    body: data as BodyInit | Record<string, unknown>
  });
}

export async function deleteBlogPost(id: number | string) {
  await requestJson<null>(v1Path(`/posts/${id}/`), { method: 'DELETE' });
  return true;
}

export async function getRecentBlogPosts(limit = 4) {
  const posts = await getBlogPosts();
  return [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function formatBlogDate(dateLike: string) {
  const date = new Date(dateLike);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function timeAgo(dateLike: string) {
  const diff = Date.now() - new Date(dateLike).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function sanitizeBlogHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/\son[a-z]+='[^']*'/gi, '');
}

export async function postBlogCommentBySlug(slug: string, body: string) {
  const csrf = getCsrfToken();

  const endpoints = [
    v1Path(`/posts/by-slug/${slug}/comments/`),
    `${API_BASE.replace(/\/$/, '')}/blog/${slug}/comments/`
  ];

  let lastError: unknown;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': decodeURIComponent(csrf) } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ body })
      });
      if (res.ok) return true;
      if (res.status === 404) continue;
      throw new Error(`Comment submit failed (${res.status})`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Comment submit failed');
}
