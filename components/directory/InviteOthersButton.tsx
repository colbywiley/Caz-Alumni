"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_INVITES_PER_REQUEST, parseEmailList } from "@/lib/validators/invite";

type FailedRecipient = { email: string; error?: string };

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; sent: string[]; failed: FailedRecipient[] }
  | { kind: "error"; message: string };

const NOTE_MAX = 500;

export function InviteOthersButton() {
  const [open, setOpen] = useState(false);
  const [emailsInput, setEmailsInput] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLTextAreaElement>(null);

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
    setEmailsInput("");
    setNote("");
    setStatus({ kind: "idle" });
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 150);
  }

  const { valid: parsedEmails, invalid: invalidTokens } = parseEmailList(emailsInput);
  const tooMany = parsedEmails.length > MAX_INVITES_PER_REQUEST;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;

    if (parsedEmails.length === 0) {
      setStatus({ kind: "error", message: "Please enter at least one valid email address." });
      return;
    }
    if (invalidTokens.length > 0) {
      setStatus({
        kind: "error",
        message: `These don't look like valid emails: ${invalidTokens.join(", ")}`,
      });
      return;
    }
    if (tooMany) {
      setStatus({
        kind: "error",
        message: `You can invite up to ${MAX_INVITES_PER_REQUEST} people at a time.`,
      });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedEmails, note: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: string[];
        failed?: FailedRecipient[];
      };
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      setStatus({ kind: "success", sent: data.sent ?? [], failed: data.failed ?? [] });
      setEmailsInput("");
      setNote("");
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  const submitDisabled =
    status.kind === "sending" || parsedEmails.length === 0 || invalidTokens.length > 0 || tooMany;

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
          <div ref={dialogRef} className="card relative z-10 w-full max-w-md p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="invite-title" className="text-xl">Invite alumni</h2>
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
                {status.sent.length > 0 && (
                  <div
                    role="status"
                    className="rounded-lg border border-[var(--color-caz-line)] bg-[var(--color-caz-cream-soft)] p-4 text-sm"
                  >
                    Sent {status.sent.length} invitation{status.sent.length === 1 ? "" : "s"} to:
                    <ul className="mt-2 list-disc pl-5">
                      {status.sent.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {status.failed.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#e6b3b3] bg-[#fdecec] p-3 text-sm text-[#8a2727]"
                  >
                    Couldn&apos;t send to:
                    <ul className="mt-2 list-disc pl-5">
                      {status.failed.map((f) => (
                        <li key={f.email}>
                          {f.email}
                          {f.error ? ` — ${f.error}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStatus({ kind: "idle" })}
                  >
                    Send more
                  </button>
                  <button type="button" className="btn btn-primary" onClick={close}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="label" htmlFor="invite-emails">
                    Email addresses
                  </label>
                  <textarea
                    ref={emailInputRef}
                    id="invite-emails"
                    required
                    rows={3}
                    className="textarea"
                    placeholder="friend@example.com, another@example.com"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    disabled={status.kind === "sending"}
                  />
                  <div className="help">
                    Separate multiple emails with commas or spaces. Up to {MAX_INVITES_PER_REQUEST} at a time.
                    {parsedEmails.length > 0 && (
                      <>
                        {" "}
                        <span className="text-[var(--color-caz-green-dark)]">
                          {parsedEmails.length} valid
                        </span>
                        {invalidTokens.length > 0 && (
                          <>
                            ,{" "}
                            <span className="text-[#8a2727]">
                              {invalidTokens.length} invalid
                            </span>
                          </>
                        )}
                        .
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="invite-note">
                    Personal note{" "}
                    <span className="font-normal text-[var(--color-caz-muted)]">(optional)</span>
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
                  <button type="submit" className="btn btn-primary" disabled={submitDisabled}>
                    {status.kind === "sending"
                      ? "Sending…"
                      : parsedEmails.length > 1
                      ? `Send ${parsedEmails.length} invitations`
                      : "Send invitation"}
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
