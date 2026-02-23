import Link from 'next/link';
import { Calendar, User } from 'lucide-react';
import type { BlogPost } from '@/lib/blog';
import { formatBlogDate } from '@/lib/blog';

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="bf-post-card">
      <div className="bf-post-thumb">
        {post.image ? (
          <img src={post.image} alt={post.title} />
        ) : (
          <div className="bf-post-thumb-placeholder">{post.emoji ?? '🍞'}</div>
        )}
        <span className="bf-post-cat">{post.category}</span>
      </div>

      <div className="bf-post-body">
        <div className="bf-post-meta">
          <span className="bf-meta-chip">
            <User size={12} />
            {post.author}
          </span>
          <span className="bf-meta-chip">
            <Calendar size={12} />
            {formatBlogDate(post.createdAt)}
          </span>
        </div>

        <Link href={`/blog/${post.slug}`} className="bf-post-title">
          {post.title}
        </Link>

        <p className="bf-post-excerpt">{post.excerpt}</p>
      </div>

      <div className="bf-post-footer">
        <Link href={`/blog/${post.slug}`} className="bf-btn-continue">
          Continue reading
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <span className="bf-post-read-time">{post.readTime} min read</span>
      </div>
    </article>
  );
}
