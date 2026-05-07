import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/events/EventCard";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let upcoming: Awaited<ReturnType<typeof loadUpcoming>> = [];
  if (user) {
    upcoming = await loadUpcoming();
  }

  return (
    <div>
      <section className="hero-bg border-b border-[var(--color-caz-line)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-caz-green-dark)]">
            For alumni of Cazadero Performing Arts Camp
          </p>
          <h1 className="font-display text-4xl leading-tight text-[var(--color-caz-green-darker)] sm:text-5xl">
            Caz Alumni Connect
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--color-caz-ink)]">
            Whether you attended Caz last year or 60 years ago—if you are like most Caz Alumni
            you treasure your Caz memories for the important musical discoveries, incredible
            camp experiences and deep friendships made. Stay connected with Caz, share your
            favorite stories, reconnect with other alum, and take part in upcoming events.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/directory" className="btn btn-primary">Browse the Alumni Directory</Link>
                <Link href="/profile" className="btn btn-secondary">Edit my profile</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary">Sign up / Sign in</Link>
                <Link href="/login?next=/directory" className="btn btn-secondary">Browse Directory</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl">Upcoming alumni events</h2>
          <Link href="/events" className="text-sm font-semibold">See all events →</Link>
        </div>
        {!user ? (
          <div className="card p-6 text-[var(--color-caz-muted)]">
            Sign in to see upcoming alumni events and RSVP.
          </div>
        ) : upcoming.length === 0 ? (
          <div className="card p-6 text-[var(--color-caz-muted)]">
            No upcoming events yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function loadUpcoming() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(3);
  return data ?? [];
}
