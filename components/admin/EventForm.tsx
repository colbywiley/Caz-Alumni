"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveEventAction } from "@/app/admin/events/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EVENT_TIME_ZONE } from "@/lib/utils";
import type { EventRow } from "@/lib/db/types";

type Props = { event?: EventRow };

function getZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function toZonedInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = getZoneOffsetMs(d, EVENT_TIME_ZONE);
  return new Date(d.getTime() + offset).toISOString().slice(0, 16);
}

function fromZonedInput(local: string): string {
  const naive = new Date(`${local}:00Z`);
  const offset = getZoneOffsetMs(naive, EVENT_TIME_ZONE);
  return new Date(naive.getTime() - offset).toISOString();
}

export function EventForm({ event }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [startAt, setStartAt] = useState(toZonedInput(event?.start_at ?? null));
  const [endAt, setEndAt] = useState(toZonedInput(event?.end_at ?? null));
  const [externalUrl, setExternalUrl] = useState(event?.external_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(event?.cover_image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  async function uploadCover(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError("Cover image must be smaller than 10 MB.");
      return;
    }
    setUploadBusy(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `events/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-covers").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    setUploadBusy(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("event-covers").getPublicUrl(path);
    setCoverImageUrl(pub.publicUrl);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveEventAction({
        id: event?.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        start_at: fromZonedInput(startAt),
        end_at: endAt ? fromZonedInput(endAt) : null,
        external_url: externalUrl.trim() || null,
        cover_image_url: coverImageUrl,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/events");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="title">Title *</label>
        <input id="title" className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="start_at">Start * <span className="text-xs font-normal text-[var(--color-caz-muted)]">(Pacific Time)</span></label>
          <input id="start_at" type="datetime-local" className="input" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="end_at">End (optional) <span className="text-xs font-normal text-[var(--color-caz-muted)]">(Pacific Time)</span></label>
          <input id="end_at" type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="location">Location</label>
        <input id="location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="external_url">External page URL (optional)</label>
        <input id="external_url" type="url" className="input" placeholder="https://cazadero.org/…" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
        <p className="help">If set, a &quot;View event page&quot; button will appear on the event detail.</p>
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" className="textarea" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="label">Cover image</label>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-40 overflow-hidden rounded-md border border-[var(--color-caz-line)] bg-[var(--color-caz-cream-soft)]">
            {coverImageUrl ? (
              <Image src={coverImageUrl} alt="" fill sizes="160px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-[var(--color-caz-sage)]">♪</div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
              e.target.value = "";
            }}
          />
          {uploadBusy && <span className="text-sm text-[var(--color-caz-muted)]">Uploading…</span>}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-end gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  );
}
