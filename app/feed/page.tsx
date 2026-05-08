import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { PostCard, type PostCardData } from "@/components/feed/PostCard";
import { FeedFilter } from "@/components/feed/FeedFilter";

const PAGE_SIZE = 30;

type SearchParams = { filter?: string };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/feed");

  const params = (await searchParams) ?? {};
  const filter: "friends" | "all" = params.filter === "all" ? "all" : "friends";

  const supabase = await createSupabaseServerClient();

  // Resolve which author ids are eligible when "My Friends" is selected.
  // We include the user's own posts so the user always sees their own activity.
  let authorIds: string[] | null = null;
  if (filter === "friends") {
    const { data: friends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", profile.id);
    authorIds = [profile.id, ...(friends ?? []).map((f) => f.friend_id)];
  }

  let postsQuery = supabase
    .from("feed_posts")
    .select("id, author_id, content, image_urls, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (authorIds && authorIds.length > 0) {
    postsQuery = postsQuery.in("author_id", authorIds);
  } else if (authorIds && authorIds.length === 0) {
    // No friends and somehow no own id — just return empty.
    postsQuery = postsQuery.in("author_id", ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data: postRows } = await postsQuery;

  const posts = postRows ?? [];

  // Hydrate authors, like counts + own-like state, and comments.
  const postIds = posts.map((p) => p.id);
  const authorIdSet = Array.from(new Set(posts.map((p) => p.author_id)));

  const [authorsRes, likesRes, ownLikesRes, commentsRes] = await Promise.all([
    authorIdSet.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, display_name, avatar_url")
          .in("id", authorIdSet)
      : Promise.resolve({ data: [] as Array<{
          id: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
        }> }),
    postIds.length > 0
      ? supabase
          .from("feed_post_likes")
          .select("post_id, profile_id")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as Array<{ post_id: string; profile_id: string }> }),
    postIds.length > 0
      ? supabase
          .from("feed_post_likes")
          .select("post_id")
          .in("post_id", postIds)
          .eq("profile_id", profile.id)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
    postIds.length > 0
      ? supabase
          .from("feed_post_comments")
          .select("id, post_id, author_id, content, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as Array<{
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        }> }),
  ]);

  const authorMap = new Map<
    string,
    { id: string; name: string; avatarUrl: string | null }
  >();
  for (const a of authorsRes.data ?? []) {
    authorMap.set(a.id, {
      id: a.id,
      name: a.display_name || a.full_name || "Caz alum",
      avatarUrl: a.avatar_url,
    });
  }

  // Pull in any commenter authors that weren't already in the post-author set.
  const commentAuthorIds = Array.from(
    new Set((commentsRes.data ?? []).map((c) => c.author_id)),
  ).filter((id) => !authorMap.has(id));
  if (commentAuthorIds.length > 0) {
    const { data: more } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url")
      .in("id", commentAuthorIds);
    for (const a of more ?? []) {
      authorMap.set(a.id, {
        id: a.id,
        name: a.display_name || a.full_name || "Caz alum",
        avatarUrl: a.avatar_url,
      });
    }
  }

  const likeCounts = new Map<string, number>();
  for (const l of likesRes.data ?? []) {
    likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1);
  }
  const liked = new Set<string>((ownLikesRes.data ?? []).map((l) => l.post_id));

  const commentsByPost = new Map<string, PostCardData["comments"]>();
  for (const c of commentsRes.data ?? []) {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push({
      id: c.id,
      authorId: c.author_id,
      author: authorMap.get(c.author_id) ?? {
        id: c.author_id,
        name: "Caz alum",
        avatarUrl: null,
      },
      content: c.content,
      createdAt: c.created_at,
    });
    commentsByPost.set(c.post_id, arr);
  }

  const cards: PostCardData[] = posts.map((p) => ({
    id: p.id,
    authorId: p.author_id,
    author: authorMap.get(p.author_id) ?? {
      id: p.author_id,
      name: "Caz alum",
      avatarUrl: null,
    },
    content: p.content,
    imageUrls: p.image_urls ?? [],
    createdAt: p.created_at,
    likeCount: likeCounts.get(p.id) ?? 0,
    likedByMe: liked.has(p.id),
    comments: commentsByPost.get(p.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl">Alumni Feed</h1>
        <p className="mt-1 text-sm text-[var(--color-caz-muted)]">
          Share an update, photo, or memory with fellow alumni. Use{" "}
          <code className="rounded bg-[var(--color-caz-cream-soft)] px-1">@</code> to mention
          someone.
        </p>
      </header>

      <FeedComposer currentUserId={profile.id} />

      <div className="mt-8 mb-4 flex items-center justify-between gap-3">
        <FeedFilter current={filter} />
        <Link href="/directory" className="text-sm text-[var(--color-caz-green-dark)] hover:underline">
          Find more alumni →
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-caz-muted)]">
          {filter === "friends" ? (
            <>
              No posts from your friends yet. Try{" "}
              <Link href="/feed?filter=all" className="text-[var(--color-caz-green-dark)] underline">
                viewing All
              </Link>{" "}
              or add more friends from the{" "}
              <Link href="/directory" className="text-[var(--color-caz-green-dark)] underline">
                directory
              </Link>
              .
            </>
          ) : (
            <>Be the first to post — share something above.</>
          )}
        </div>
      ) : (
        <ul className="space-y-5">
          {cards.map((c) => (
            <li key={c.id} id={`post-${c.id}`}>
              <PostCard post={c} currentUserId={profile.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
