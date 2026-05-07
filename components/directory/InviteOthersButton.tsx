"use client";

import { useEffect, useRef, useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; email: string }
  | { kind: "error"; message: string };

const NOTE_MAX = 500;

export function InviteOthersButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    emailInputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function reset() {
    setEmail("");
    setNote("");
    setStatus({ kind: "idle" });
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 150);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), note: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      setStatus({ kind: "success", email: email.trim() });
      setEmail("");
      setNote("");
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16v16H4z" />
          <path d="m22 6-10 7L2 6" />
        </svg>
        Invite Others
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <div
            ref={dialogRef}
            className="card relative z-10 w-full max-w-md p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="invite-title" className="text-xl">Invite an alum</h2>
                <p className="mt-1 text-sm text-[var(--color-caz-muted)]">
                  Send a branded email invitation to join Caz Alumni Connect.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="btn btn-ghost px-2 py-1 text-lg leading-none"
                onClick={close}
              >
                ×
              </button>
            </div>

            {status.kind === "success" ? (
              <div className="space-y-4">
                <div
                  role="status"
                  className="rounded-lg border border-[var(--color-caz-line)] bg-[var(--color-caz-cream-soft)] p-4 text-sm"
                >
                  Invitation sent to <strong>{status.email}</strong>. Thanks for spreading the word!
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setStatus({ kind: "idle" })}>
                    Send another
                  </button>
                  <button type="button" className="btn btn-primary" onClick={close}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="label" htmlFor="invite-email">
                    Email address
                  </label>
                  <input
                    ref={emailInputRef}
                    id="invite-email"
                    type="email"
                    required
                    className="input"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status.kind === "sending"}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="invite-note">
                    Personal note <span className="font-normal text-[var(--color-caz-muted)]">(optional)</span>
                  </label>
                  <textarea
                    id="invite-note"
                    className="textarea"
                    placeholder="Hey! Thought you'd love to reconnect with the Caz crowd…"
                    maxLength={NOTE_MAX}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={status.kind === "sending"}
                  />
                  <div className="help text-right">
                    {note.length}/{NOTE_MAX}
                  </div>
                </div>

                {status.kind === "error" && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#e6b3b3] bg-[#fdecec] p-3 text-sm text-[#8a2727]"
                  >
                    {status.message}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={close}
                    disabled={status.kind === "sending"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status.kind === "sending" || email.trim().length === 0}
                  >
                    {status.kind === "sending" ? "Sending…" : "Send invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
