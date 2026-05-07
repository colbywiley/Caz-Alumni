"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { initialsFromName } from "@/lib/utils";

type Props = {
  userId: string;
  currentUrl: string | null;
  onUploaded: (publicUrl: string) => void;
  size?: number;
};

export function AvatarUploader({ userId, currentUrl, onUploaded, size = 128 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  async function handleFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be smaller than 5 MB.");
      return;
    }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setPreview(pub.publicUrl);
    onUploaded(pub.publicUrl);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-full border border-[var(--color-caz-line)] bg-[var(--color-caz-cream-soft)] text-2xl font-semibold text-[var(--color-caz-green-darker)]"
        style={{ width: size, height: size }}
      >
        {preview ? (
          <Image src={preview} alt="" fill sizes={`${size}px`} className="object-cover" />
        ) : (
          <span>{initialsFromName(null, "C")}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn btn-secondary"
        disabled={busy}
      >
        {busy ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}
