import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/constants/picklists";
import { formatYearRange, initialsFromName } from "@/lib/utils";
import type { AlumniRoleRow, ProfileRow } from "@/lib/db/types";

type Params = Promise<{ id: string }>;

export default async function AlumProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const profile = profileRaw as ProfileRow | null;
  if (!profile) notFound();
  if (!profile.show_in_directory) {
    // Self-view of an unlisted profile is allowed; everyone else gets a 404.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== profile.id) notFound();
  }
  const { data: rolesRaw } = await supabase
    .from("alumni_roles")
    .select("*")
    .eq("profile_id", id);
  const roles = (rolesRaw ?? []) as AlumniRoleRow[];

  const name = profile.display_name || profile.full_name || "Caz Alum";
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card overflow-hidden">
        <div className="hero-bg h-32" />
        <div className="-mt-16 px-6 pb-8">
          <div className="flex items-end gap-5">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[var(--color-caz-cream-soft)] shadow">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill sizes="128px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[var(--color-caz-green-darker)]">
                  {initialsFromName(name)}
                </div>
              )}
            </div>
            <div className="pb-2">
              <h1 className="font-display text-3xl text-[var(--color-caz-green-darker)]">{name}</h1>
              {location && <div className="text-sm text-[var(--color-caz-muted)]">{location}</div>}
            </div>
          </div>

          {profile.share_email_in_directory && profile.show_in_directory && (
            <div className="mt-5">
              <a className="font-semibold" href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
          )}

          {roles.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg">Time at Caz</h2>
              <ul className="mt-2 space-y-2">
                {roles.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-green">{ROLE_LABEL[r.role]}</span>
                    <span className="text-sm text-[var(--color-caz-ink)]">
                      {formatYearRange(r.start_year, r.end_year)}
                    </span>
                    {r.role === "staff" && r.positions?.length > 0 && (
                      <span className="text-sm text-[var(--color-caz-muted)]">
                        — {r.positions.filter((p) => p !== "Other").join(", ")}
                        {r.positions.includes("Other") && r.other_position && (
                          <>
                            {r.positions.length > 1 ? ", " : ""}
                            {r.other_position}
                          </>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.instruments?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg">Instruments</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.instruments.map((i) => (
                  <span key={i} className="badge">{i}</span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg">A favorite Caz memory</h2>
              <p className="prose-caz mt-2 whitespace-pre-line text-[var(--color-caz-ink)]">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
