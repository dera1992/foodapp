import Link from 'next/link';
import type { BlogPost, BlogCategory } from '@/lib/blog';
import { timeAgo } from '@/lib/blog';

interface BlogSidebarProps {
  recentPosts: BlogPost[];
  categories: BlogCategory[];
  searchQuery?: string;
  activeCategorySlug?: string;
}

export function BlogSidebar({ recentPosts, categories, searchQuery, activeCategorySlug }: BlogSidebarProps) {
  return (
    <aside className="bf-blog-sidebar">
      {/* Search */}
      <div className="bf-sb-card">
        <div className="bf-sb-title">Search</div>
        <div className="bf-sb-search">
          <form action="/blog" method="get" className="bf-sb-search-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" name="q" defaultValue={searchQuery ?? ''} placeholder="Search posts..." />
            {activeCategorySlug ? <input type="hidden" name="category" value={activeCategorySlug} /> : null}
            <button type="submit" className="bf-sb-search-btn" aria-label="Search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bf-sb-card">
        <div className="bf-sb-title">Recent Posts</div>
        <div className="bf-recent-list">
          {recentPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="bf-recent-item">
              <div className="bf-recent-thumb">
                {post.image ? <img src={post.image} alt={post.title} /> : (post.emoji ?? '📰')}
              </div>
              <div>
                <div className="bf-recent-title">{post.title}</div>
                <div className="bf-recent-time">{timeAgo(post.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bf-sb-card">
        <div className="bf-sb-title">Categories</div>
        <div className="bf-cat-list">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/blog?category=${cat.slug}`} className="bf-cat-item">
              <div className="bf-cat-dot" />
              {cat.name}
              <span className="bf-cat-count">{cat.postCount}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="bf-sb-card">
        <div className="bf-sb-title">Trending</div>
        <div className="bf-trending-empty">No trending items yet.</div>
      </div>
    </aside>
  );
}
