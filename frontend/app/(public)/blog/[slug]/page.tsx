import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User } from 'lucide-react';
import {
  getBlogPost,
  getBlogCategories,
  getRecentBlogPosts,
  sanitizeBlogHtml,
  formatBlogDate,
} from '@/lib/blog';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { CommentForm } from '@/components/blog/CommentForm';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: 'Post not found – Bunchfood' };
  return {
    title: `${post.title} – Bunchfood Blog`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  const [post, categories, recentPosts] = await Promise.all([
    getBlogPost(slug),
    getBlogCategories(),
    getRecentBlogPosts(4),
  ]);

  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bunchfood.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const safeContent = sanitizeBlogHtml(post.content);
  const comments = post.comments ?? [];

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* Breadcrumb */}
      <nav className="bf-blog-breadcrumb">
        <a href="/">🏠 Home</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <a href="/blog">Blog</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="active">{post.title}</span>
      </nav>

      {/* Page grid */}
      <div className="bf-blog-wrap">
        <main>

          {/* Article */}
          <article className="bf-article-card bf-fade-up">

            {/* Hero */}
            <div className="bf-article-hero">
              {post.image ? (
                <img src={post.image} alt={post.title} />
              ) : (
                <div className="bf-hero-emoji">{post.emoji ?? '🍞'}</div>
              )}
              <div className="bf-hero-overlay" />
              <span className="bf-article-cat-badge">{post.category}</span>
              <h1 className="bf-article-hero-title">{post.title}</h1>
            </div>

            {/* Meta */}
            <div className="bf-article-header">
              <div className="bf-article-meta">
                <span className="bf-meta-chip">
                  <User size={13} />
                  Posted by&nbsp;<strong style={{ color: 'var(--text)' }}>{post.author}</strong>
                </span>
                <span className="bf-meta-chip">
                  <Calendar size={13} />
                  <strong style={{ color: 'var(--text)' }}>{formatBlogDate(post.createdAt)}</strong>
                </span>
                <span className="bf-meta-chip">
                  <Clock size={13} />
                  {post.readTime} min read
                </span>
              </div>
            </div>

            {/* Body */}
            <div
              className="bf-article-body"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />

            {/* Share */}
            <ShareButtons url={postUrl} title={post.title} />

          </article>

          {/* Comments */}
          <section className="bf-comments-section bf-fade-up" style={{ animationDelay: '0.12s' }}>
            <div className="bf-comments-head">
              <h2>Comments</h2>
              <span className="bf-comments-count">{comments.length}</span>
            </div>

            {comments.length === 0 ? (
              <div className="bf-no-comments">
                <span className="bf-nc-emoji">💬</span>
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div>
                {comments.map(comment => (
                  <div key={comment.id} className="bf-comment-item">
                    <div className="bf-comment-author">{comment.author}</div>
                    <div className="bf-comment-time">{formatBlogDate(comment.createdAt)}</div>
                    <p className="bf-comment-body">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}

            <CommentForm slug={post.slug} />
          </section>

        </main>

        <BlogSidebar recentPosts={recentPosts} categories={categories} />
      </div>

    </div>
  );
}
