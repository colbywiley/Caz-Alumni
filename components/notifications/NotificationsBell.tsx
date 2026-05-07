"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import type { NotificationFeedItem } from "@/lib/notifications";

type Props = {
  items: NotificationFeedItem[];
  unreadCount: number;
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell({ items, unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onClickItem(item: NotificationFeedItem) {
    if (!item.read) {
      startTransition(async () => {
        await markNotificationReadAction(item.id);
        router.refresh();
      });
    }
    setOpen(false);
  }

  function onMarkAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-caz-green-darker)] hover:bg-[var(--color-caz-cream-soft)]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a6 6 0 0 0-6 6v3.586l-1.707 1.707A1 1 0 0 0 5 16h14a1 1 0 0 0 .707-1.707L18 12.586V9a6 6 0 0 0-6-6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 19a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-caz-gold)] px-1 text-[11px] font-bold leading-[18px] text-white"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[var(--color-caz-line)] bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-caz-line)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-caz-ink)]">
              Notifications
            </h3>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={pending || unreadCount === 0}
              className="text-xs font-medium text-[var(--color-caz-green-dark)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--color-caz-muted)] disabled:no-underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-caz-muted)]">
                You&rsquo;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-caz-line)]">
                {items.map((item) => {
                  const Inner = (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]">
                        {item.actor?.avatarUrl ? (
                          <Image
                            src={item.actor.avatarUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-caz-green-dark)]">
                            {(item.actor?.name ?? "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-[var(--color-caz-ink)]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-caz-muted)]">
                          {formatRelative(item.createdAt)}
                        </p>
                      </div>
                      {!item.read && (
                        <span
                          aria-hidden="true"
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-caz-gold)]"
                        />
                      )}
                    </div>
                  );

                  const rowClass = `block w-full text-left ${
                    item.read ? "" : "bg-[var(--color-caz-cream-soft)]/60"
                  } hover:bg-[var(--color-caz-cream-soft)]`;

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => onClickItem(item)}
                          className={rowClass}
                        >
                          {Inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onClickItem(item)}
                          className={rowClass}
                        >
                          {Inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
