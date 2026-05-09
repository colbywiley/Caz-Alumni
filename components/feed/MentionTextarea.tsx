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
import { mentionStillPresent, sanitizeMentionName } from "@/lib/feed/mentions";

export type DraftMention = { profileId: string; name: string };

type Suggestion = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Props = {
  value: string;
  mentions: DraftMention[];
  onChange: (text: string, mentions: DraftMention[]) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: number;
  className?: string;
  disabled?: boolean;
  hint?: string;
};

// Detect whether the caret sits inside an "@…" trigger. The @ must start the
// line or follow whitespace, and the typed query so far must not contain any
// whitespace yet.
function detectTrigger(
  value: string,
  caret: number,
): { start: number; query: string } | null {
  if (caret <= 0) return null;
  let i = caret - 1;
  while (i >= 0) {
    const ch = value[i];
    if (ch === "@") {
      const before = i === 0 ? " " : value[i - 1];
      if (i === 0 || /\s/.test(before)) {
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

function pruneMentions(text: string, list: DraftMention[]): DraftMention[] {
  return list.filter((m) => mentionStillPresent(text, m.name));
}

export function MentionTextarea({
  value,
  mentions,
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
      const caretEnd =
        ta?.selectionEnd ?? trigger.start + trigger.query.length + 1;
      const after = value.slice(caretEnd);
      const cleanName = sanitizeMentionName(s.name) || "alum";
      const insertText = `@${cleanName} `;
      const next = `${before}${insertText}${after}`;
      const nextMentions = pruneMentions(next, [
        ...mentions.filter((m) => m.profileId !== s.id),
        { profileId: s.id, name: cleanName },
      ]);
      onChange(next, nextMentions);
      setTrigger(null);
      setOpen(false);
      requestAnimationFrame(() => {
        if (!ta) return;
        const caret = before.length + insertText.length;
        ta.focus();
        ta.setSelectionRange(caret, caret);
      });
    },
    [trigger, value, mentions, onChange],
  );

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const nextMentions = pruneMentions(next, mentions);
    onChange(next, nextMentions);
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
          setTimeout(() => setOpen(false), 120);
        }}
      />
      {hint && <p className="help">{hint}</p>}

      {mentions.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-[var(--color-caz-muted)]">
          <span className="uppercase tracking-wider text-[var(--color-caz-gold)]">
            Linked
          </span>
          {mentions.map((m) => (
            <span
              key={m.profileId}
              className="rounded-full bg-[var(--color-caz-cream-soft)] px-2 py-0.5 text-[var(--color-caz-green-darker)]"
            >
              @{m.name}
            </span>
          ))}
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
