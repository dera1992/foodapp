'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { createComment, type ApiComment } from '@/lib/api/endpoints';

interface CommentFormProps {
  slug: string;
  postId?: number;
  onCreated?: (comment: ApiComment) => void;
}

export function CommentForm({ slug, postId, onCreated }: CommentFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      if (postId != null) {
        const created = await createComment({ post: postId, content: text.trim() });
        onCreated?.(created);
      } else {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';
        const res = await fetch(`${API_BASE}/blog/${slug}/comments/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ body: text }),
        });
        if (!res.ok) throw new Error('Failed to post comment');
      }
      setSuccess(true);
      setText('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError('Please sign in to post a comment.');
      } else {
        setError('Could not post comment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bf-comment-form">
      <h3>Leave a comment</h3>
      <form onSubmit={handleSubmit}>
        <div className="bf-form-field">
          <label htmlFor="comment-text">Your comment</label>
          <textarea
            id="comment-text"
            placeholder="Share your thoughts…"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--accent-red)', marginBottom: '10px' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: '0.82rem', color: 'var(--green)', marginBottom: '10px' }}>
            Comment submitted! It will appear after review.
          </p>
        )}
        <button type="submit" className="bf-btn-submit" disabled={loading || !text.trim()}>
          {loading ? 'Posting…' : 'Submit Comment'}
        </button>
      </form>
    </div>
  );
}
