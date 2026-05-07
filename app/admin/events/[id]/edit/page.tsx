import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";

type Params = Promise<{ id: string }>;

export default async function EditEventPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-3xl">Edit event</h1>
        <Link href={`/events/${event.slug}`} className="btn btn-ghost">View live →</Link>
      </div>
      <div className="mt-2">
        <EventForm event={event} />
      </div>
      <div className="mt-8">
        <DeleteEventButton id={event.id} title={event.title} />
      </div>
    </div>
  );
}
