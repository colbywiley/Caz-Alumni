"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractMentionedProfileIds, mentionsToPlainText } from "@/lib/feed/mentions";
import { renderPostMentionEmail } from "@/lib/email/postMentionTemplate";

const MAX_CONTENT = 4000;
const MAX_IMAGES = 4;

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function err(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export async function createPostAction(input: {
  content: string;
  image_urls: string[];
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Sign in to post.");

  const content = (input.content ?? "").trim();
  const imageUrls = (input.image_urls ?? []).filter(
    (u) => typeof u === "string" && u.length > 0,
  );

  if (content.length === 0 && imageUrls.length === 0) {
    return err("Add some text or a photo.");
  }
  if (content.length > MAX_CONTENT) {
    return err(`Posts are limited to ${MAX_CONTENT} characters.`);
  }
  if (imageUrls.length > MAX_IMAGES) {
    return err(`You can attach up to ${MAX_IMAGES} photos.`);
  }

  const { data: post, error } = await supabase
    .from("feed_posts")
    .insert({
      author_id: user.id,
      content,
      image_urls: imageUrls,
    })
    .select("id")
    .single();
  if (error || !post) return err(error?.message ?? "Could not create post.");

  void notifyMentions({
    actorId: user.id,
    postId: post.id,
    content,
    surface: "post",
  }).catch((e) => console.error("notifyMentions(post) failed:", e));

  revalidatePath("/feed");
  return { ok: true, data: { id: post.id } };
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Sign in to manage posts.");

  const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
  if (error) return err(error.message);

  revalidatePath("/feed");
  return { ok: true };
}

export async function togglePostLikeAction(
  postId: string,
): Promise<ActionResult<{ liked: boolean }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Sign in to like posts.");

  const { data: existing } = await supabase
    .from("feed_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("feed_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
    if (error) return err(error.message);
    revalidatePath("/feed");
    return { ok: true, data: { liked: false } };
  }

  const { error } = await supabase
    .from("feed_post_likes")
    .insert({ post_id: postId, profile_id: user.id });
  if (error) return err(error.message);
  revalidatePath("/feed");
  return { ok: true, data: { liked: true } };
}

export async function createCommentAction(input: {
  postId: string;
  content: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Sign in to comment.");

  const content = (input.content ?? "").trim();
  if (content.length === 0) return err("Comment can't be empty.");
  if (content.length > MAX_CONTENT) {
    return err(`Comments are limited to ${MAX_CONTENT} characters.`);
  }

  const { data: comment, error } = await supabase
    .from("feed_post_comments")
    .insert({
      post_id: input.postId,
      author_id: user.id,
      content,
    })
    .select("id")
    .single();
  if (error || !comment) return err(error?.message ?? "Could not post comment.");

  void notifyMentions({
    actorId: user.id,
    postId: input.postId,
    content,
    surface: "comment",
  }).catch((e) => console.error("notifyMentions(comment) failed:", e));

  revalidatePath("/feed");
  return { ok: true, data: { id: comment.id } };
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Sign in to manage comments.");

  const { error } = await supabase
    .from("feed_post_comments")
    .delete()
    .eq("id", commentId);
  if (error) return err(error.message);

  revalidatePath("/feed");
  return { ok: true };
}

export async function searchProfilesForMentionAction(query: string): Promise<
  Array<{ id: string; name: string; avatar_url: string | null }>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const q = query.trim();
  if (q.length === 0) return [];

  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, avatar_url, show_in_directory")
    .eq("show_in_directory", true)
    .or(`full_name.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(8);
  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    name: p.display_name || p.full_name || "Caz alum",
    avatar_url: p.avatar_url,
  }));
}

// ===========================================================================
// Notifications + email fan-out for @ mentions
// ===========================================================================

async function notifyMentions(args: {
  actorId: string;
  postId: string;
  content: string;
  surface: "post" | "comment";
}) {
  const mentionedIds = extractMentionedProfileIds(args.content)
    .filter((id) => id !== args.actorId);
  if (mentionedIds.length === 0) return;

  const supabase = await createSupabaseServerClient();

  const { data: actor } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email")
    .eq("id", args.actorId)
    .maybeSingle();
  if (!actor) return;

  const { data: recipients } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, notify_on_post_tag")
    .in("id", mentionedIds);
  if (!recipients || recipients.length === 0) return;

  const notifType = args.surface === "post" ? "post_tag" : "comment_tag";

  const inAppRows = recipients.map((r) => ({
    user_id: r.id,
    actor_id: actor.id,
    type: notifType,
    data: {
      actor_name: actor.display_name || actor.full_name || "A Caz alum",
      post_id: args.postId,
      surface: args.surface,
    },
  }));
  // We always record the in-app bell notification regardless of email pref.
  await supabase.from("notifications").insert(inAppRows);

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.INVITE_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    console.warn(
      "Skipping mention email: RESEND_API_KEY or INVITE_FROM_EMAIL not configured.",
    );
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const postUrl = `${siteUrl}/feed#post-${args.postId}`;
  const actorName = actor.display_name || actor.full_name || "A Caz alum";
  const preview = mentionsToPlainText(args.content);
  const resend = new Resend(apiKey);

  await Promise.all(
    recipients
      .filter((r) => r.notify_on_post_tag && r.email)
      .map(async (r) => {
        const { subject, html, text } = renderPostMentionEmail({
          recipientName: r.display_name || r.full_name || "there",
          actorName,
          actorEmail: actor.email ?? null,
          preview,
          postUrl,
          siteUrl,
          surface: args.surface,
        });
        const { error: sendErr } = await resend.emails.send({
          from: fromAddress,
          to: r.email,
          subject,
          html,
          text,
          replyTo: actor.email ?? undefined,
        });
        if (sendErr) console.error("Resend mention email error:", sendErr);
      }),
  );
}
