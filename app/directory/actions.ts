"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addFriendAction(friendId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to add friends." };
  if (user.id === friendId) return { ok: false as const, error: "You can't friend yourself." };

  const { error } = await supabase
    .from("friendships")
    .upsert(
      { user_id: user.id, friend_id: friendId },
      { onConflict: "user_id,friend_id" },
    );
  if (error) return { ok: false as const, error: error.message };

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
