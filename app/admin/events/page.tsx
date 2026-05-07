import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/utils";

export default async function AdminEventsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl">Manage events</h1>
        <Link href="/admin/events/new" className="btn btn-primary">+ New event</Link>
      </div>

      {(events?.length ?? 0) === 0 ? (
        <div className="card p-6 text-[var(--color-caz-muted)]">No events yet.</div>
      ) : (
        <div className="card divide-y divide-[var(--color-caz-line)]">
          {events!.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-display text-lg">{e.title}</div>
                <div className="text-sm text-[var(--color-caz-muted)]">
                  {formatEventDateTime(e.start_at)}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/events/${e.slug}`} className="btn btn-ghost">View</Link>
                <Link href={`/admin/events/${e.id}/edit`} className="btn btn-secondary">Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
