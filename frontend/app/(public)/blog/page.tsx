import type { Metadata } from 'next';
import { getBlogPosts, getBlogCategories, getRecentBlogPosts } from '@/lib/blog';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { PostCard } from '@/components/blog/PostCard';

export const metadata: Metadata = {
  title: 'Blog – Bunchfood',
  description: 'Stories, tips, and updates from the bunchfood team.',
};

export default async function BlogPage() {
  const [posts, categories, recentPosts] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
    getRecentBlogPosts(4),
  ]);

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* Breadcrumb */}
      <nav className="bf-blog-breadcrumb">
        <a href="/">🏠 Home</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="active">Blog</span>
      </nav>

      {/* Page grid */}
      <div className="bf-blog-wrap">
        <main>
          <div className="bf-blog-section-head">
            <h1>Blog</h1>
            <p>Stories, tips, and updates from the bunchfood team.</p>
          </div>

          {posts.length > 0 ? (
            <div className="bf-posts-grid">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '40px 0' }}>
              No posts yet. Check back soon!
            </p>
          )}
        </main>

        <BlogSidebar recentPosts={recentPosts} categories={categories} />
      </div>

    </div>
  );
}
