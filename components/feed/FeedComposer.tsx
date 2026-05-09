"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/app/feed/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { composeMentions } from "@/lib/feed/mentions";
import { MentionTextarea, type DraftMention } from "./MentionTextarea";

const MAX_IMAGES = 4;
const MAX_BYTES = 8 * 1024 * 1024;

type Props = {
  currentUserId: string;
};

export function FeedComposer({ currentUserId }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<DraftMention[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} photos.`);
      return;
    }
    const queue = Array.from(files).slice(0, remaining);
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const uploaded: string[] = [];
    try {
      for (const file of queue) {
        if (!file.type.startsWith("image/")) {
          setError("Photos only, please.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError("Each photo must be smaller than 8 MB.");
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${currentUserId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("feed-images")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        const { data: pub } = supabase.storage.from("feed-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function submit() {
    setError(null);
    if (content.trim().length === 0 && images.length === 0) {
      setError("Add some text or a photo.");
      return;
    }
    const canonical = composeMentions(content, mentions);
    startTransition(async () => {
      const res = await createPostAction({
        content: canonical,
        image_urls: images,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setContent("");
      setMentions([]);
      setImages([]);
      router.refresh();
    });
  }

  const disabled = pending || uploading;

  return (
    <section className="card p-4 sm:p-5">
      <MentionTextarea
        value={content}
        mentions={mentions}
        onChange={(text, m) => {
          setContent(text);
          setMentions(m);
        }}
        placeholder="Share something with the alumni community… use @ to mention someone."
        rows={4}
        minHeight={120}
        disabled={pending}
        hint="Mentioned alumni get a notification (and an email if they have it enabled)."
      />

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-md border border-[var(--color-caz-line)]">
              <Image src={url} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs font-bold text-white hover:bg-black/75"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || images.length >= MAX_IMAGES}
          >
            {uploading ? "Uploading…" : "Add photo"}
          </button>
          <span className="ml-2 text-xs text-[var(--color-caz-muted)]">
            {images.length}/{MAX_IMAGES}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={submit}
          disabled={disabled}
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
