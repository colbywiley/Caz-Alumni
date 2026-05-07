import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/EventCard";

export const metadata = { title: "Alumni Events · Caz Alumni Connect" };

export default async function EventsPage() {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .lt("start_at", nowIso)
      .order("start_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Upcoming alumni events</h1>
      <p className="mt-2 text-[var(--color-caz-muted)]">
        From reunion weekends to one-night gatherings — RSVP and see who else is going.
      </p>

      {(!upcoming || upcoming.length === 0) ? (
        <div className="card mt-6 p-8 text-center text-[var(--color-caz-muted)]">
          No upcoming events yet — check back soon, or follow Caz on Facebook.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}

      {past && past.length > 0 && (
        <details className="mt-12">
          <summary className="cursor-pointer text-lg font-semibold text-[var(--color-caz-green-dark)]">
            Recent past events
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </details>
      )}
    </div>
  );
}
