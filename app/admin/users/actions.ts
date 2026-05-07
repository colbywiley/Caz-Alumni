"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function setAdminAction(userId: string, isAdmin: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true as const };
}
