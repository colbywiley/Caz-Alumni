"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { addFriendAction, removeFriendAction } from "@/app/directory/actions";

export function AddFriendButton({
  friendId,
  isFriend,
  size = "md",
}: {
  friendId: string;
  isFriend: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [friend, setFriend] = useState(isFriend);
  const [err, setErr] = useState<string | null>(null);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setErr(null);
    const next = !friend;
    setFriend(next);
    startTransition(async () => {
      const res = next
        ? await addFriendAction(friendId)
        : await removeFriendAction(friendId);
      if (!res.ok) {
        setFriend(!next);
        setErr(res.error);
      }
      router.refresh();
    });
  }

  const sizeClass = size === "sm" ? "px-2.5 py-1 text-xs" : "";

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`${friend ? "btn btn-secondary" : "btn btn-primary"} ${sizeClass}`}
      >
        {friend ? "✓ Friend" : "Add friend"}
      </button>
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}
