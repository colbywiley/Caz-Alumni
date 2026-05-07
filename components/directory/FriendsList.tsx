import Link from "next/link";
import Image from "next/image";
import type { ProfileRow } from "@/lib/db/types";
import { initialsFromName } from "@/lib/utils";

export function FriendsList({
  friends,
  emptyMessage,
}: {
  friends: ProfileRow[];
  emptyMessage: string;
}) {
  if (friends.length === 0) {
    return <p className="mt-2 text-sm text-[var(--color-caz-muted)]">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {friends.map((f) => {
        const fName = f.display_name || f.full_name || "Caz Alum";
        return (
          <li key={f.id}>
            <Link
              href={`/directory/${f.id}`}
              className="card flex items-center gap-3 p-3 transition hover:shadow-md"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]">
                {f.avatar_url ? (
                  <Image src={f.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-caz-green-darker)]">
                    {initialsFromName(fName)}
                  </div>
                )}
              </div>
              <span className="truncate text-sm font-semibold text-[var(--color-caz-green-darker)]">
                {fName}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
