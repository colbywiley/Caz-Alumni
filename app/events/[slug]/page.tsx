import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatEventDateTime, formatEventTime } from "@/lib/utils";
import { RsvpButton } from "@/components/events/RsvpButton";
import { AttendeeList } from "@/components/events/AttendeeList";
import type { EventRow } from "@/lib/db/types";

type Params = Promise<{ slug: string }>;

type AttendeeRsvp = {
  event_id: string;
  profile_id: string;
  status: "going" | "not_going";
  created_at: string;
  profiles:
    | {
        id: string;
        full_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
        show_in_directory: boolean;
      }
    | null;
};

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: eventRaw } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const event = eventRaw as EventRow | null;
  if (!event) notFound();

  const { data: rsvpsRaw } = await supabase
    .from("event_rsvps")
    .select(
      "event_id, profile_id, status, created_at, profiles:profile_id(id, full_name, display_name, avatar_url, show_in_directory)",
    )
    .eq("event_id", event.id)
    .eq("status", "going")
    .order("created_at", { ascending: true });
  const rsvps = (rsvpsRaw ?? []).map((r: unknown) => {
    const row = r as AttendeeRsvp & { profiles: AttendeeRsvp["profiles"] | AttendeeRsvp["profiles"][] };
    const prof = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
    return { ...row, profiles: prof } as AttendeeRsvp;
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myRsvp = rsvps.find((r) => r.profile_id === user?.id) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <article className="card overflow-hidden">
        <div className="relative h-56 w-full bg-[var(--color-caz-cream-soft)] sm:h-72">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt="" fill sizes="100vw" className="object-cover" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-[var(--color-caz-sage)]">♪</div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-caz-gold)]">
            {formatEventDateTime(event.start_at, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}
            {event.end_at && (
              <>
                <span className="mx-1.5 text-[var(--color-caz-muted)]">→</span>
                {formatEventTime(event.end_at)}
              </>
            )}
          </div>
          <h1 className="mt-2 font-display text-3xl text-[var(--color-caz-green-darker)] sm:text-4xl">{event.title}</h1>
          {event.location && (
            <div className="mt-1 text-[var(--color-caz-muted)]">{event.location}</div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <RsvpButton
              eventId={event.id}
              isAttending={!!myRsvp}
              disabled={!user}
            />
            {event.external_url && (
              <Link href={event.external_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                View event page ↗
              </Link>
            )}
            {!user && (
              <Link href={`/login?next=/events/${event.slug}`} className="btn btn-ghost">Sign in to RSVP</Link>
            )}
          </div>

          {event.description && (
            <div className="prose-caz mt-6 whitespace-pre-line text-[var(--color-caz-ink)]">{event.description}</div>
          )}

          <hr className="my-8 border-[var(--color-caz-line)]" />

          <AttendeeList rsvps={rsvps} totalLabel="Going" />
        </div>
      </article>
    </div>
  );
}
