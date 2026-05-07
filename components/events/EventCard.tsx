import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { EventRow } from "@/lib/db/types";

export function EventCard({ event }: { event: EventRow }) {
  const start = new Date(event.start_at);
  return (
    <Link href={`/events/${event.slug}`} className="card group block overflow-hidden transition hover:shadow-md">
      <div className="relative h-40 w-full bg-[var(--color-caz-cream-soft)]">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-[var(--color-caz-sage)]">
            ♪
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-caz-gold)]">
          {format(start, "EEE, MMM d, yyyy · p")}
        </div>
        <h3 className="mt-1 line-clamp-2 text-lg group-hover:text-[var(--color-caz-green)]">
          {event.title}
        </h3>
        {event.location && (
          <div className="mt-1 text-sm text-[var(--color-caz-muted)]">{event.location}</div>
        )}
      </div>
    </Link>
  );
}
