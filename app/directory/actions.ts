"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderFriendAddedEmail } from "@/lib/email/friendAddedTemplate";
import { getSiteUrl } from "@/lib/siteUrl";

export async function addFriendAction(friendId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to add friends." };
  if (user.id === friendId) return { ok: false as const, error: "You can't friend yourself." };

  // Was this friendship already in place? If so, don't re-notify.
  const { data: existing } = await supabase
    .from("friendships")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("friend_id", friendId)
    .maybeSingle();
  const wasNew = !existing;

  const { error } = await supabase
    .from("friendships")
    .upsert(
      { user_id: user.id, friend_id: friendId },
      { onConflict: "user_id,friend_id" },
    );
  if (error) return { ok: false as const, error: error.message };

  if (wasNew) {
    // Fire-and-forget: notification + email shouldn't block the friend add.
    void notifyFriendAdded(user.id, friendId).catch((err) => {
      console.error("notifyFriendAdded failed:", err);
    });
  }

  revalidatePath("/directory");
  revalidatePath(`/directory/${user.id}`);
  revalidatePath(`/directory/${friendId}`);
  return { ok: true as const };
}

export async function removeFriendAction(friendId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to manage friends." };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", friendId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/directory");
  revalidatePath(`/directory/${user.id}`);
  revalidatePath(`/directory/${friendId}`);
  return { ok: true as const };
}

async function notifyFriendAdded(actorId: string, recipientId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: actor } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email")
    .eq("id", actorId)
    .maybeSingle();

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, notify_on_friend_add")
    .eq("id", recipientId)
    .maybeSingle();

  if (!actor || !recipient) return;

  // Always record the in-app notification — the bell shows it regardless of
  // the recipient's email preference.
  await supabase.from("notifications").insert({
    user_id: recipient.id,
    actor_id: actor.id,
    type: "friend_added",
    data: {
      actor_name: actor.display_name || actor.full_name || "A Caz alum",
    },
  });

  if (!recipient.notify_on_friend_add) return;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.INVITE_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    console.warn(
      "Skipping friend-add email: RESEND_API_KEY or INVITE_FROM_EMAIL not configured.",
    );
    return;
  }
  if (!recipient.email) return;

  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/directory/${actor.id}`;
  const frienderName = actor.display_name || actor.full_name || "A Caz alum";
  const recipientName = recipient.display_name || recipient.full_name || "there";

  const { subject, html, text } = renderFriendAddedEmail({
    recipientName,
    frienderName,
    frienderEmail: actor.email ?? null,
    profileUrl,
    siteUrl,
  });

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from: fromAddress,
    to: recipient.email,
    subject,
    html,
    text,
    replyTo: actor.email ?? undefined,
  });
  if (sendErr) {
    console.error("Resend friend-add email error:", sendErr);
  }
}
