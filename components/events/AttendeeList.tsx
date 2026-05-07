"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { initialsFromName } from "@/lib/utils";

type Attendee = {
  profile_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    show_in_directory: boolean;
  } | null;
};

const PREVIEW = 8;

export function AttendeeList({ rsvps, totalLabel = "Going" }: { rsvps: Attendee[]; totalLabel?: string }) {
  const [open, setOpen] = useState(false);
  const visible = rsvps.slice(0, PREVIEW);
  const hidden = Math.max(0, rsvps.length - PREVIEW);

  return (
    <section>
      <h2 className="text-lg">
        {totalLabel} <span className="ml-1 text-[var(--color-caz-muted)]">({rsvps.length})</span>
      </h2>
      {rsvps.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-caz-muted)]">Be the first to say you&apos;re going!</p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {visible.map((r) => (
              <AttendeeChip key={r.profile_id} a={r} />
            ))}
            {hidden > 0 && (
              <li>
                <button onClick={() => setOpen(true)} className="badge hover:bg-[var(--color-caz-cream-soft)]">
                  See all {rsvps.length} →
                </button>
              </li>
            )}
          </ul>

          {open && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setOpen(false)}
            >
              <div className="card max-h-[80vh] w-full max-w-md overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">All attendees ({rsvps.length})</h3>
                  <button onClick={() => setOpen(false)} className="btn btn-ghost px-2">×</button>
                </div>
                <ul className="mt-3 space-y-2">
                  {rsvps.map((r) => (
                    <li key={r.profile_id}>
                      <AttendeeRow a={r} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AttendeeChip({ a }: { a: Attendee }) {
  const name = a.profiles?.display_name || a.profiles?.full_name || "Caz Alum";
  const link = a.profiles?.show_in_directory ? `/directory/${a.profiles.id}` : null;
  const inner = (
    <span className="badge px-2 py-1">
      <span className="relative -ml-0.5 mr-1 inline-block h-5 w-5 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)] align-middle">
        {a.profiles?.avatar_url ? (
          <Image src={a.profiles.avatar_url} alt="" fill sizes="20px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[var(--color-caz-green-darker)]">
            {initialsFromName(name)}
          </span>
        )}
      </span>
      {name}
    </span>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function AttendeeRow({ a }: { a: Attendee }) {
  const name = a.profiles?.display_name || a.profiles?.full_name || "Caz Alum";
  const link = a.profiles?.show_in_directory ? `/directory/${a.profiles.id}` : null;
  const body = (
    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--color-caz-cream-soft)]">
      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]">
        {a.profiles?.avatar_url ? (
          <Image src={a.profiles.avatar_url} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--color-caz-green-darker)]">
            {initialsFromName(name)}
          </div>
        )}
      </div>
      <div className="text-sm">{name}</div>
    </div>
  );
  return link ? <Link href={link}>{body}</Link> : body;
}
