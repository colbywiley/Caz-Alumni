"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRsvpAction } from "@/app/events/actions";

export function RsvpButton({
  eventId,
  isAttending,
  disabled,
}: {
  eventId: string;
  isAttending: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [going, setGoing] = useState(isAttending);
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    setErr(null);
    const next = !going;
    setGoing(next);
    startTransition(async () => {
      const res = await setRsvpAction(eventId, next);
      if (!res.ok) {
        setGoing(!next);
        setErr(res.error);
      }
      router.refresh();
    });
  }

  if (disabled) return null;

  return (
    <div>
      <button
        onClick={toggle}
        disabled={pending}
        className={going ? "btn btn-secondary" : "btn btn-primary"}
      >
        {going ? "✓ You’re going" : "I’m going"}
      </button>
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}
