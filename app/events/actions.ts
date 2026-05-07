"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setRsvpAction(eventId: string, going: boolean) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to RSVP." };

  if (going) {
    const { error } = await supabase
      .from("event_rsvps")
      .upsert(
        { event_id: eventId, profile_id: user.id, status: "going" },
        { onConflict: "event_id,profile_id" },
      );
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", user.id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/events");
  // We don't know the slug here; the detail page revalidates on its own load.
  return { ok: true as const };
}
