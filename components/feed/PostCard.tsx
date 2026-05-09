"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCommentAction,
  deleteCommentAction,
  deletePostAction,
  togglePostLikeAction,
} from "@/app/feed/actions";
import { composeMentions } from "@/lib/feed/mentions";
import { MentionContent } from "./MentionContent";
import { MentionTextarea, type DraftMention } from "./MentionTextarea";

export type PostCardData = {
  id: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl: string | null };
  content: string;
  imageUrls: string[];
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Array<{
    id: string;
    authorId: string;
    author: { id: string; name: string; avatarUrl: string | null };
    content: string;
    createdAt: string;
  }>;
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-caz-green-darker)]">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function PostCard({
  post,
  currentUserId,
}: {
  post: PostCardData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useState(post.likedByMe);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentMentions, setCommentMentions] = useState<DraftMention[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const isOwner = post.authorId === currentUserId;

  function toggleLike() {
    const next = !optimisticLiked;
    setOptimisticLiked(next);
    setOptimisticCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await togglePostLikeAction(post.id);
      if (!res.ok) {
        // Revert.
        setOptimisticLiked(!next);
        setOptimisticCount((c) => c + (next ? -1 : 1));
        setPostError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  function submitComment() {
    setCommentError(null);
    if (commentDraft.trim().length === 0) return;
    const canonical = composeMentions(commentDraft, commentMentions);
    startTransition(async () => {
      const res = await createCommentAction({
        postId: post.id,
        content: canonical,
      });
      if (!res.ok) {
        setCommentError(res.error);
        return;
      }
      setCommentDraft("");
      setCommentMentions([]);
      setShowCommentBox(false);
      router.refresh();
    });
  }

  function removePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deletePostAction(post.id);
      if (!res.ok) {
        setPostError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function removeComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteCommentAction(commentId);
      if (!res.ok) {
        setCommentError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/directory/${post.author.id}`}>
            <Avatar url={post.author.avatarUrl} name={post.author.name} />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/directory/${post.author.id}`}
              className="block truncate font-display text-base font-semibold text-[var(--color-caz-green-darker)] hover:text-[var(--color-caz-green)]"
            >
              {post.author.name}
            </Link>
            <p className="text-xs text-[var(--color-caz-muted)]">
              {formatRelative(post.createdAt)}
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={removePost}
            disabled={pending}
            className="rounded p-1 text-xs text-[var(--color-caz-muted)] hover:bg-[var(--color-caz-cream-soft)] hover:text-red-700"
            aria-label="Delete post"
          >
            Delete
          </button>
        )}
      </header>

      {post.content.trim().length > 0 && (
        <div className="mt-3">
          <MentionContent content={post.content} />
        </div>
      )}

      {post.imageUrls.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${
            post.imageUrls.length === 1
              ? "grid-cols-1"
              : post.imageUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {post.imageUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block overflow-hidden rounded-lg border border-[var(--color-caz-line)]"
            >
              <span className="relative block aspect-square">
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 200px, 50vw"
                  className="object-cover"
                />
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-1 border-t border-[var(--color-caz-line)] pt-3 text-sm">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-pressed={optimisticLiked}
          className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-medium transition hover:bg-[var(--color-caz-cream-soft)] ${
            optimisticLiked
              ? "text-[var(--color-caz-green-dark)]"
              : "text-[var(--color-caz-muted)]"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={optimisticLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.6 3 5 6.5 5c2 0 3.5 1.1 4.5 2.6C12 6.1 13.5 5 15.5 5 19 5 21 8.6 19.5 11.8 17.5 16.4 12 21 12 21z" strokeLinejoin="round" />
          </svg>
          <span>{optimisticCount}</span>
          <span className="hidden sm:inline">{optimisticLiked ? "Liked" : "Like"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCommentBox((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-medium text-[var(--color-caz-muted)] transition hover:bg-[var(--color-caz-cream-soft)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" strokeLinejoin="round" />
          </svg>
          <span>{post.comments.length}</span>
          <span className="hidden sm:inline">Comment</span>
        </button>
      </div>

      {postError && (
        <p className="mt-2 text-xs text-red-600">{postError}</p>
      )}

      {(post.comments.length > 0 || showCommentBox) && (
        <ul className="mt-3 space-y-3 border-t border-[var(--color-caz-line)] pt-3">
          {post.comments.map((c) => {
            const ownsComment = c.authorId === currentUserId || isOwner;
            return (
              <li key={c.id} className="flex items-start gap-3">
                <Link href={`/directory/${c.author.id}`}>
                  <Avatar url={c.author.avatarUrl} name={c.author.name} size={32} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-[var(--color-caz-cream-soft)] px-3 py-2">
                    <Link
                      href={`/directory/${c.author.id}`}
                      className="text-sm font-semibold text-[var(--color-caz-green-darker)] hover:underline"
                    >
                      {c.author.name}
                    </Link>
                    <div className="mt-0.5 text-sm">
                      <MentionContent content={c.content} />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--color-caz-muted)]">
                    <span>{formatRelative(c.createdAt)}</span>
                    {ownsComment && (
                      <button
                        type="button"
                        onClick={() => removeComment(c.id)}
                        className="hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}

          {showCommentBox && (
            <li>
              <MentionTextarea
                value={commentDraft}
                mentions={commentMentions}
                onChange={(text, m) => {
                  setCommentDraft(text);
                  setCommentMentions(m);
                }}
                placeholder="Write a comment… use @ to mention someone."
                rows={2}
                minHeight={56}
                disabled={pending}
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCommentBox(false);
                    setCommentDraft("");
                    setCommentMentions([]);
                    setCommentError(null);
                  }}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitComment}
                  disabled={pending || commentDraft.trim().length === 0}
                >
                  {pending ? "Posting…" : "Comment"}
                </button>
              </div>
              {commentError && (
                <p className="mt-1 text-xs text-red-600">{commentError}</p>
              )}
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
