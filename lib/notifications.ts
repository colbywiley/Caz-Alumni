import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationFeedItem = {
  id: string;
  type: "friend_added" | "photo_tag" | "post_tag";
  read: boolean;
  createdAt: string;
  title: string;
  href: string | null;
  actor: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

const RECENT_LIMIT = 20;

export async function getRecentNotifications(): Promise<{
  items: NotificationFeedItem[];
  unreadCount: number;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unreadCount: 0 };

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, type, data, read_at, created_at, actor_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error || !rows) return { items: [], unreadCount: 0 };

  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))),
  );
  const actorMap = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url")
      .in("id", actorIds);
    for (const a of actors ?? []) {
      actorMap.set(a.id, {
        id: a.id,
        name: a.display_name || a.full_name || "A Caz alum",
        avatarUrl: a.avatar_url,
      });
    }
  }

  const items: NotificationFeedItem[] = rows.map((row) => {
    const actor = row.actor_id ? actorMap.get(row.actor_id) ?? null : null;
    const data = (row.data ?? {}) as Record<string, unknown>;
    const fallbackName =
      (typeof data.actor_name === "string" && data.actor_name) || "Someone";
    const actorName = actor?.name ?? fallbackName;

    let title: string;
    let href: string | null;
    switch (row.type) {
      case "friend_added":
        title = `${actorName} added you as a friend`;
        href = actor ? `/directory/${actor.id}` : null;
        break;
      case "photo_tag":
        title = `${actorName} tagged you in a photo`;
        href = actor ? `/directory/${actor.id}` : null;
        break;
      case "post_tag":
        title = `${actorName} tagged you in a post`;
        href = actor ? `/directory/${actor.id}` : null;
        break;
      default:
        title = "New notification";
        href = null;
    }

    return {
      id: row.id,
      type: row.type as NotificationFeedItem["type"],
      read: row.read_at != null,
      createdAt: row.created_at,
      title,
      href,
      actor,
    };
  });

  const unreadCount = items.filter((i) => !i.read).length;
  return { items, unreadCount };
}
