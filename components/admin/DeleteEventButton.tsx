"use client";

import { useTransition } from "react";
import { deleteEventAction } from "@/app/admin/events/actions";

export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteEventAction(id);
    });
  }
  return (
    <button onClick={onClick} className="btn btn-danger" disabled={pending}>
      {pending ? "Deleting…" : "Delete event"}
    </button>
  );
}
