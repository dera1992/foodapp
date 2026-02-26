'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { CommentForm } from '@/components/blog/CommentForm';
import {
  deleteComment,
  getCurrentUserId,
  patchComment,
  type ApiComment
} from '@/lib/api/endpoints';
import { formatBlogDate } from '@/lib/blog';

type BlogCommentsClientProps = {
  slug: string;
  postId: number;
  initialComments: ApiComment[];
};

export function BlogCommentsClient({ slug, postId, initialComments }: BlogCommentsClientProps) {
  const [comments, setComments] = useState<ApiComment[]>(initialComments);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId).catch(() => setCurrentUserId(null));
  }, []);

  const visibleComments = comments.filter((comment) => String(comment.post ?? '') === String(postId));

  const onCreate = (comment: ApiComment) => {
    setComments((current) => [comment, ...current]);
  };

  const beginEdit = (comment: ApiComment) => {
    setEditingId(String(comment.id));
    setEditingText(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async (id: string) => {
    const content = editingText.trim();
    if (!content) return;
    const prev = comments;
    setComments((current) => current.map((item) => (String(item.id) === id ? { ...item, content } : item)));
    cancelEdit();
    try {
      await patchComment(id, { content });
    } catch {
      setComments(prev);
    }
  };

  const onDelete = async (id: string) => {
    const prev = comments;
    setComments((current) => current.filter((item) => String(item.id) !== id));
    try {
      await deleteComment(id);
    } catch {
      setComments(prev);
    }
  };

  return (
    <>
      <div className="bf-comments-head">
        <h2>Comments</h2>
        <span className="bf-comments-count">{visibleComments.length}</span>
      </div>

      {visibleComments.length === 0 ? (
        <div className="bf-no-comments">
          <span className="bf-nc-emoji">💬</span>
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div>
          {visibleComments.map((comment) => {
            const ownComment = currentUserId != null && String(comment.user ?? '') === String(currentUserId);
            const isEditing = editingId === String(comment.id);
            return (
              <div key={comment.id} className="bf-comment-item">
                <div className="bf-comment-author">{comment.user ? `User ${comment.user}` : 'User'}</div>
                <div className="bf-comment-time">{formatBlogDate(comment.timestamp ?? new Date().toISOString())}</div>
                {isEditing ? (
                  <>
                    <textarea
                      className="w-full rounded-xl border border-brand-border p-3 text-sm"
                      rows={3}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" className="rounded-lg border border-brand-border p-2" onClick={cancelEdit} aria-label="Cancel edit comment">
                        <X className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg bg-brand-primary p-2 text-white" onClick={() => saveEdit(String(comment.id))} aria-label="Save comment">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="bf-comment-body">{comment.content}</p>
                    {ownComment ? (
                      <div className="mt-2 flex justify-end gap-2">
                        <button type="button" className="rounded-lg border border-brand-border bg-white p-2 text-brand-muted" onClick={() => beginEdit(comment)} aria-label="Edit comment">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-lg border border-brand-border bg-white p-2 text-red-600" onClick={() => onDelete(String(comment.id))} aria-label="Delete comment">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CommentForm slug={slug} postId={postId} onCreated={onCreate} />
    </>
  );
}
