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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'building-to-last',
    title: 'Building to last',
    excerpt: 'How bunchfood is building a durable food-rescue platform with reliable tools, clear processes, and local shop partnerships.',
    content: `
      <h2>Tools You Can Use</h2>
      <ul>
        <li>Collaborative filtering for personalised recommendations</li>
        <li>Rule-based pricing and freshness alerts in Django</li>
        <li>Queue-backed background jobs for low-stock updates</li>
      </ul>
      <p>Building a marketplace that survives real-world usage takes more than a nice interface. You need predictable operations, clear ownership, and solid fallback paths for every critical flow.</p>
      <div class="bf-blog-callout"><span class="bf-blog-callout-icon">💡</span><div>Since bunchfood uses Django REST + Next.js, a lightweight recommendation service can be added later without changing the core checkout flow.</div></div>
      <h2>Build a Recommendation Microservice</h2>
      <p>Start small. Cache personalised recommendations per user and refresh them on key events like completed orders and wishlist changes.</p>
      <ul>
        <li>Expose a single <code>/api/recommendations/</code> endpoint</li>
        <li>Cache user recommendations in Redis</li>
        <li>Fallback to top-selling items when no profile exists</li>
      </ul>
    `,
    image: null,
    emoji: '🌿',
    category: 'Food',
    categorySlug: 'food',
    author: 'Admin',
    createdAt: '2026-02-23T09:00:00.000Z',
    readTime: 4,
    comments: []
  },
  {
    id: 2,
    slug: '5-ways-to-save-more-on-fresh-deals',
    title: '5 ways to save more on fresh deals',
    excerpt: 'Simple habits customers can use to get better value from near-expiry deals without wasting food at home.',
    content: `
      <h2>Shop With a Plan</h2>
      <p>Start with a short list based on meals you can cook in 24 to 48 hours. This prevents overbuying and helps you take advantage of steep discounts responsibly.</p>
      <h2>Use Filters</h2>
      <ul>
        <li>Filter by category to compare similar products quickly</li>
        <li>Check expiry dates before adding items to cart</li>
        <li>Prioritize products you can freeze or preserve</li>
      </ul>
    `,
    image: null,
    emoji: '🛒',
    category: 'Tips',
    categorySlug: 'tips',
    author: 'Bunchfood Team',
    createdAt: '2026-02-21T14:30:00.000Z',
    readTime: 3,
    comments: [
      { id: 'c1', author: 'Chidera', body: 'This is helpful. A meal plan really reduces waste.', createdAt: '2026-02-22T08:00:00.000Z' }
    ]
  },
  {
    id: 3,
    slug: 'how-shops-recover-value-from-surplus',
    title: 'How shops recover value from surplus inventory',
    excerpt: 'A practical look at how local shops use bunchfood to reduce waste, move fast inventory, and build repeat customers.',
    content: `
      <h2>Why surplus happens</h2>
      <p>Demand shifts daily. Weather, holidays, and supplier timing can all leave shops with more fresh items than expected.</p>
      <h2>What works</h2>
      <ul>
        <li>Create clear discount bands based on expiry windows</li>
        <li>Highlight high-turnover products during peak hours</li>
        <li>Use dispatch support for same-day local deliveries</li>
      </ul>
    `,
    image: null,
    emoji: '🏪',
    category: 'Shops',
    categorySlug: 'shops',
    author: 'Operations Team',
    createdAt: '2026-02-19T12:15:00.000Z',
    readTime: 5,
    comments: []
  },
  {
    id: 4,
    slug: 'dispatchers-and-on-time-deliveries',
    title: 'Dispatchers and on-time deliveries',
    excerpt: 'How dispatcher onboarding, routing discipline, and communication improve customer trust and repeat orders.',
    content: `
      <h2>Consistency beats speed alone</h2>
      <p>Customers trust delivery windows when dispatchers provide updates and arrive consistently, even if routes are busy.</p>
      <h2>Dispatcher checklist</h2>
      <ul>
        <li>Confirm pickup before leaving the previous drop</li>
        <li>Review destination and contact details early</li>
        <li>Mark status updates as the order moves</li>
      </ul>
    `,
    image: null,
    emoji: '🛵',
    category: 'Dispatch',
    categorySlug: 'dispatch',
    author: 'Logistics Team',
    createdAt: '2026-02-18T16:40:00.000Z',
    readTime: 4,
    comments: []
  }
];

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

function mapComment(raw: unknown, index: number): BlogComment {
  const record = toRecord(raw);
  return {
    id: pickString(record, ['id']) || `comment-${index + 1}`,
    author: pickString(record, ['author', 'name', 'user_name']) || 'Guest',
    body: pickString(record, ['body', 'comment', 'content']) || '',
    createdAt: pickString(record, ['created_at', 'createdAt', 'date']) || new Date().toISOString()
  };
}

function mapPost(raw: unknown, index: number): BlogPost {
  const record = toRecord(raw);
  const title = pickString(record, ['title', 'name']) || `Blog Post ${index + 1}`;
  const category = pickString(record, ['category']) || 'General';
  const content = pickString(record, ['content', 'body']) || '<p>Post content is not available yet.</p>';
  const commentsRaw = Array.isArray(record.comments) ? record.comments : [];
  return {
    id: Number(pickString(record, ['id']) || index + 1),
    slug: pickString(record, ['slug']) || slugify(title),
    title,
    excerpt: pickString(record, ['excerpt', 'summary']) || 'Read the latest update from bunchfood.',
    content,
    image: pickString(record, ['image', 'thumbnail']) || null,
    emoji: pickString(record, ['emoji']) || null,
    category,
    categorySlug: pickString(record, ['category_slug']) || slugify(category),
    author: pickString(record, ['author', 'author_name']) || 'Bunchfood Team',
    createdAt: pickString(record, ['createdAt', 'created_at', 'published_at']) || new Date().toISOString(),
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

export async function getBlogPosts() {
  try {
    const payload = await tryRequest(['/api/blog/', backendPath('/blog/')]);
    const list = normalizeListPayload(payload).map(mapPost);
    return list.length ? list : FALLBACK_POSTS;
  } catch {
    return FALLBACK_POSTS;
  }
}

export async function getBlogPost(slug: string) {
  try {
    const payload = await tryRequest([`/api/blog/${slug}/`, backendPath(`/blog/${slug}/`)]);
    return mapPost(payload, 0);
  } catch {
    return FALLBACK_POSTS.find((post) => post.slug === slug) ?? null;
  }
}

export async function getBlogCategories() {
  try {
    const payload = await tryRequest(['/api/blog/categories/', backendPath('/blog/categories/')]);
    const list = normalizeListPayload(payload);
    const categories = list.map((item, index) => {
      const record = toRecord(item);
      const name = pickString(record, ['name', 'category']) || `Category ${index + 1}`;
      return {
        id: Number(pickString(record, ['id']) || index + 1),
        name,
        slug: pickString(record, ['slug']) || slugify(name),
        postCount: pickNumber(record, ['postCount', 'post_count', 'count']) || 0
      } satisfies BlogCategory;
    });
    if (categories.length) return categories;
  } catch {
    // fall through to derived categories
  }

  const counts = new Map<string, { name: string; count: number }>();
  for (const post of FALLBACK_POSTS) {
    const key = post.categorySlug;
    const current = counts.get(key);
    counts.set(key, { name: post.category, count: (current?.count ?? 0) + 1 });
  }
  return Array.from(counts.entries()).map(([slug, value], index) => ({
    id: index + 1,
    name: value.name,
    slug,
    postCount: value.count
  }));
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

