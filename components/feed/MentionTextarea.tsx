"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { searchProfilesForMentionAction } from "@/app/feed/actions";
import { buildMentionMarker, parseMentionTokens } from "@/lib/feed/mentions";

type Suggestion = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: number;
  className?: string;
  // Disables the underlying textarea while still letting the suggestion
  // dropdown stay alive — used during submit.
  disabled?: boolean;
  // Optional small footnote rendered under the textarea.
  hint?: string;
};

// Detect whether the caret is currently in an "@…" trigger context. We require
// the @ to be the start of the line or preceded by whitespace, and the term to
// not contain spaces yet.
function detectTrigger(value: string, caret: number): { start: number; query: string } | null {
  if (caret <= 0) return null;
  // Walk backwards from caret to find the latest '@'.
  let i = caret - 1;
  while (i >= 0) {
    const ch = value[i];
    if (ch === "@") {
      const before = i === 0 ? " " : value[i - 1];
      if (/\s|^/.test(before) || i === 0) {
        const query = value.slice(i + 1, caret);
        if (/\s/.test(query)) return null;
        if (query.length > 30) return null;
        return { start: i, query };
      }
      return null;
    }
    if (/\s/.test(ch)) return null;
    i--;
  }
  return null;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  minHeight,
  className,
  disabled,
  hint,
}: Props) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const queryRef = useRef("");

  // Debounce / latest-only the suggestion search.
  useEffect(() => {
    if (!trigger) {
      setOpen(false);
      setSuggestions([]);
      return;
    }
    const q = trigger.query;
    queryRef.current = q;
    if (q.trim().length === 0) {
      setSuggestions([]);
      setOpen(true);
      setActiveIdx(0);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await searchProfilesForMentionAction(q);
      // Drop stale results.
      if (queryRef.current !== q) return;
      setSuggestions(res);
      setActiveIdx(0);
      setOpen(true);
    }, 120);
    return () => clearTimeout(handle);
  }, [trigger]);

  const insertMention = useCallback(
    (s: Suggestion) => {
      if (!trigger) return;
      const ta = ref.current;
      const before = value.slice(0, trigger.start);
      const after = value.slice((ta?.selectionEnd ?? trigger.start + trigger.query.length + 1));
      const marker = buildMentionMarker(s.id, s.name);
      const next = `${before}${marker} ${after}`;
      onChange(next);
      setTrigger(null);
      setOpen(false);
      // Move caret to just after the inserted marker (+ trailing space).
      requestAnimationFrame(() => {
        if (!ta) return;
        const caret = before.length + marker.length + 1;
        ta.focus();
        ta.setSelectionRange(caret, caret);
      });
    },
    [trigger, value, onChange],
  );

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    onChange(next);
    const caret = e.target.selectionStart ?? next.length;
    setTrigger(detectTrigger(next, caret));
  }

  function handleKeyUp(e: KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const caret = ta.selectionStart ?? ta.value.length;
    setTrigger(detectTrigger(ta.value, caret));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      const choice = suggestions[activeIdx];
      if (choice) {
        e.preventDefault();
        insertMention(choice);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setTrigger(null);
    }
  }

  // Render a faint "preview" of any committed mentions above the textarea so
  // users can see what got linked. Only show when the value contains markers.
  const preview = parseMentionTokens(value).filter((t) => t.kind === "mention");

  return (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        className={`textarea ${className ?? ""}`}
        style={minHeight ? { minHeight } : undefined}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Defer so a click on a suggestion still registers.
          setTimeout(() => setOpen(false), 120);
        }}
      />
      {hint && <p className="help">{hint}</p>}

      {preview.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-[var(--color-caz-muted)]">
          <span className="uppercase tracking-wider text-[var(--color-caz-gold)]">
            Linked
          </span>
          {preview.map((m, i) =>
            m.kind === "mention" ? (
              <span
                key={`${m.profileId}-${i}`}
                className="rounded-full bg-[var(--color-caz-cream-soft)] px-2 py-0.5 text-[var(--color-caz-green-darker)]"
              >
                @{m.name}
              </span>
            ) : null,
          )}
        </div>
      )}

      {open && trigger && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-[var(--color-caz-line)] bg-white shadow-lg"
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--color-caz-muted)]">
              {trigger.query.trim().length === 0
                ? "Keep typing to search alumni…"
                : "No matches in the directory."}
            </p>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseDown={(e) => {
                      // Prevent textarea blur from racing the click.
                      e.preventDefault();
                      insertMention(s);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                      i === activeIdx
                        ? "bg-[var(--color-caz-cream-soft)]"
                        : "bg-white"
                    }`}
                  >
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--color-caz-cream-soft)]">
                      {s.avatar_url ? (
                        <Image
                          src={s.avatar_url}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--color-caz-green-darker)]">
                          {s.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="truncate font-medium text-[var(--color-caz-ink)]">
                      {s.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
