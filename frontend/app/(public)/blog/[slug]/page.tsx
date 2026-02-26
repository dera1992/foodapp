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
import { getComments } from '@/lib/api/endpoints';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { BlogCommentsClient } from '@/components/blog/BlogCommentsClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: 'Post not found - Bunchfood' };
  return {
    title: `${post.title} - Bunchfood Blog`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  const [post, categories, recentPosts, commentsApiResult] = await Promise.all([
    getBlogPost(slug),
    getBlogCategories(),
    getRecentBlogPosts(4),
    getComments().catch(() => ({ data: [] as Array<{ id: string; post?: string | number; content: string; timestamp?: string; user?: string | number }> })),
  ]);

  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bunchfood.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const safeContent = sanitizeBlogHtml(post.content);
  const apiCommentsForPost = commentsApiResult.data.filter((comment) => String(comment.post ?? '') === String(post.id));
  const initialComments = apiCommentsForPost.length
    ? apiCommentsForPost
    : (post.comments ?? []).map((comment) => ({
        id: String(comment.id),
        post: post.id,
        content: comment.body,
        timestamp: comment.createdAt,
      }));

  return (
    <div style={{ background: 'var(--cream)' }}>
      <nav className="bf-blog-breadcrumb">
        <a href="/">Home</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <a href="/blog">Blog</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="active">{post.title}</span>
      </nav>

      <div className="bf-blog-wrap">
        <main>
          <article className="bf-article-card bf-fade-up">
            <div className="bf-article-hero">
              {post.image ? (
                <img src={post.image} alt={post.title} />
              ) : (
                <div className="bf-hero-emoji">{post.emoji ?? 'B'}</div>
              )}
              <div className="bf-hero-overlay" />
              <span className="bf-article-cat-badge">{post.category}</span>
              <h1 className="bf-article-hero-title">{post.title}</h1>
            </div>

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

            <div className="bf-article-body" dangerouslySetInnerHTML={{ __html: safeContent }} />

            <ShareButtons url={postUrl} title={post.title} />
          </article>

          <section className="bf-comments-section bf-fade-up" style={{ animationDelay: '0.12s' }}>
            <BlogCommentsClient slug={post.slug} postId={post.id} initialComments={initialComments} />
          </section>
        </main>

        <BlogSidebar recentPosts={recentPosts} categories={categories} />
      </div>
    </div>
  );
}
