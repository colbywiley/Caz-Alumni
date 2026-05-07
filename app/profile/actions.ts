"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";

export async function saveProfileAction(input: ProfileInput) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const data = parsed.data;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      display_name: data.display_name ?? null,
      phone: data.phone ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      country: data.country ?? null,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      instruments: data.instruments,
      show_in_directory: data.show_in_directory,
      share_email_in_directory: data.share_email_in_directory,
      notify_on_friend_add: data.notify_on_friend_add,
      notify_on_photo_tag: data.notify_on_photo_tag,
      notify_on_post_tag: data.notify_on_post_tag,
    })
    .eq("id", user.id);
  if (profileErr) return { ok: false as const, error: profileErr.message };

  // Replace roles with the submitted set (delete-all then insert).
  const { error: delErr } = await supabase
    .from("alumni_roles")
    .delete()
    .eq("profile_id", user.id);
  if (delErr) return { ok: false as const, error: delErr.message };

  if (data.roles.length > 0) {
    const rows = data.roles.map((r) => ({
      profile_id: user.id,
      role: r.role,
      start_year: r.start_year,
      end_year: r.end_year,
      positions: r.role === "staff" ? r.positions : [],
      other_position: r.positions.includes("Other") ? r.other_position : null,
    }));
    const { error: insErr } = await supabase.from("alumni_roles").insert(rows);
    if (insErr) return { ok: false as const, error: insErr.message };
  }

  revalidatePath("/profile");
  revalidatePath("/directory");
  revalidatePath(`/directory/${user.id}`);
  return { ok: true as const };
}
