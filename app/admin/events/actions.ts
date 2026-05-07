"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventSchema, type EventInput } from "@/lib/validators/event";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type EventActionInput = EventInput & { id?: string };

export async function saveEventAction(input: EventActionInput) {
  const admin = await requireAdmin();
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (input.id) {
    const { error } = await supabase
      .from("events")
      .update({
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        start_at: data.start_at,
        end_at: data.end_at ?? null,
        external_url: data.external_url ?? null,
        cover_image_url: data.cover_image_url ?? null,
      })
      .eq("id", input.id);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath("/events");
    revalidatePath(`/events/${(await supabase.from("events").select("slug").eq("id", input.id).maybeSingle()).data?.slug ?? ""}`);
    revalidatePath("/admin/events");
    return { ok: true as const, id: input.id };
  } else {
    const baseSlug = slugify(data.title) || "event";
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
    }
    const { data: inserted, error } = await supabase
      .from("events")
      .insert({
        slug,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        start_at: data.start_at,
        end_at: data.end_at ?? null,
        external_url: data.external_url ?? null,
        cover_image_url: data.cover_image_url ?? null,
        created_by: admin.id,
      })
      .select("id, slug")
      .maybeSingle();
    if (error || !inserted) return { ok: false as const, error: error?.message ?? "Insert failed" };
    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { ok: true as const, id: inserted.id };
  }
}

export async function deleteEventAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/events");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}
