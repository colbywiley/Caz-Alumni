import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { AlumniCard } from "@/components/directory/AlumniCard";
import { InviteOthersButton } from "@/components/directory/InviteOthersButton";
import { getCurrentUser } from "@/lib/auth";
import type { AlumniRoleRow, ProfileRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Alumni Directory · Caz Alumni Connect" };

type SearchParams = Promise<{ q?: string; role?: string; decade?: string; instrument?: string }>;

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("show_in_directory", true)
    .order("full_name", { ascending: true });
  const profiles = (profilesRaw ?? []) as ProfileRow[];

  const profileIds = profiles.map((p) => p.id);
  const { data: rolesRaw } = profileIds.length
    ? await supabase.from("alumni_roles").select("*").in("profile_id", profileIds)
    : { data: [] };
  const roles = (rolesRaw ?? []) as AlumniRoleRow[];

  const rolesByProfile = new Map<string, AlumniRoleRow[]>();
  for (const r of roles) {
    const arr = rolesByProfile.get(r.profile_id) ?? [];
    arr.push(r);
    rolesByProfile.set(r.profile_id, arr);
  }

  // Filters (server-side)
  const q = (params.q ?? "").trim().toLowerCase();
  const roleFilter = params.role ?? "";
  const decadeFilter = params.decade ?? "";
  const instrumentFilter = params.instrument ?? "";

  const filtered = profiles.filter((p) => {
    const name = (p.display_name || p.full_name || "").toLowerCase();
    if (q && !name.includes(q)) return false;
    const pr = rolesByProfile.get(p.id) ?? [];
    if (roleFilter && !pr.some((r) => r.role === roleFilter)) return false;
    if (decadeFilter) {
      const d = Number(decadeFilter);
      const inDecade = pr.some((r) => {
        const s = r.start_year ?? 9999;
        const e = r.end_year ?? new Date().getFullYear();
        return s <= d + 9 && e >= d;
      });
      if (!inDecade) return false;
    }
    if (instrumentFilter && !(p.instruments ?? []).includes(instrumentFilter)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Alumni Directory</h1>
          <p className="mt-2 text-[var(--color-caz-muted)]">
            Reconnect with fellow Caz alumni. Showing {filtered.length} of {profiles.length} alumni
            who&apos;ve opted in.
          </p>
        </div>
        {currentUser && <InviteOthersButton />}
      </header>

      <DirectoryFilters />

      {filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-[var(--color-caz-muted)]">
          No alumni match your filters yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: ProfileRow) => (
            <AlumniCard
              key={p.id}
              profile={p}
              roles={rolesByProfile.get(p.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
