import type { Metadata } from 'next';
import {
  getBlogPosts,
  getBlogCategories,
  getRecentBlogPosts,
} from '@/lib/blog';
import { PostCard } from '@/components/blog/PostCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';

type SearchParams = Promise<{
  category?: string | string[];
  q?: string | string[];
  search?: string | string[];
}>;

interface Props {
  searchParams: SearchParams;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const metadata: Metadata = {
  title: 'Blog - Bunchfood',
  description: 'Stories, tips, and updates from the bunchfood team.',
};

export default async function BlogListPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const category = firstParam(resolved.category)?.trim() || undefined;
  const q = (firstParam(resolved.q) ?? firstParam(resolved.search))?.trim() || undefined;

  const [posts, categories, recentPosts] = await Promise.all([
    getBlogPosts({ category, q }),
    getBlogCategories(),
    getRecentBlogPosts(4),
  ]);

  const activeCategoryName = category
    ? (categories.find((item) => item.slug === category)?.name ?? category)
    : null;

  return (
    <div style={{ background: 'var(--cream)' }}>
      <nav className="bf-blog-breadcrumb">
        <a href="/">Home</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="active">Blog</span>
      </nav>

      <div className="bf-blog-wrap">
        <main>
          <div className="bf-blog-section-head">
            <h1>Blog</h1>
            <p>
              Stories, tips, and updates from the bunchfood team.
              {activeCategoryName ? ` Category: ${activeCategoryName}.` : ''}
              {q ? ` Search: "${q}".` : ''}
            </p>
          </div>

          <div className="bf-posts-grid">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div
                className="bf-post-card"
                style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center' }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-fraunces), serif',
                    fontSize: '1.1rem',
                    color: 'var(--text)',
                  }}
                >
                  No posts found
                </h2>
                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  Try a different category or search term.
                </p>
              </div>
            )}
          </div>
        </main>

        <BlogSidebar
          recentPosts={recentPosts}
          categories={categories}
          searchQuery={q}
          activeCategorySlug={category}
        />
      </div>
    </div>
  );
}
