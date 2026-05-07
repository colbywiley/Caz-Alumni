import Link from "next/link";
import Image from "next/image";
import type { AlumniRoleRow, ProfileRow } from "@/lib/db/types";
import { formatYearRange, initialsFromName } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/constants/picklists";

export function AlumniCard({ profile, roles }: { profile: ProfileRow; roles: AlumniRoleRow[] }) {
  const name = profile.display_name || profile.full_name || "Caz Alum";
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <Link href={`/directory/${profile.id}`} className="card group block overflow-hidden p-5 transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[var(--color-caz-green-darker)]">
              {initialsFromName(name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold text-[var(--color-caz-green-darker)] group-hover:text-[var(--color-caz-green)]">
            {name}
          </div>
          {location && <div className="text-xs text-[var(--color-caz-muted)]">{location}</div>}
        </div>
      </div>

      {roles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <span key={r.id} className="badge">
              {ROLE_LABEL[r.role]} {formatYearRange(r.start_year, r.end_year)}
            </span>
          ))}
        </div>
      )}

      {profile.instruments?.length > 0 && (
        <div className="mt-3 text-xs text-[var(--color-caz-muted)]">
          <span className="font-semibold uppercase tracking-wider text-[var(--color-caz-gold)]">Instruments</span>{" "}
          {profile.instruments.slice(0, 4).join(", ")}
          {profile.instruments.length > 4 && ` +${profile.instruments.length - 4}`}
        </div>
      )}

      {profile.share_email_in_directory && (
        <div className="mt-3 truncate text-xs text-[var(--color-caz-green-dark)]">{profile.email}</div>
      )}
    </Link>
  );
}
