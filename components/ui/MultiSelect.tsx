"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({ options, value, onChange, placeholder = "Add…" }: Props) {
  const [query, setQuery] = useState("");
  const remaining = options.filter(
    (o) => !value.includes(o) && o.toLowerCase().includes(query.toLowerCase()),
  );

  function add(opt: string) {
    if (!value.includes(opt)) onChange([...value, opt]);
    setQuery("");
  }
  function remove(opt: string) {
    onChange(value.filter((v) => v !== opt));
  }

  return (
    <div className="rounded-lg border border-[var(--color-caz-line)] bg-white p-2">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="badge badge-green">
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="ml-1 -mr-1 rounded-full bg-white/20 px-1 text-xs leading-none hover:bg-white/30"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="w-full border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && remaining.length > 0 && (
        <div className="mt-2 max-h-48 overflow-auto rounded-md border border-[var(--color-caz-line)] bg-white">
          {remaining.slice(0, 20).map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => add(o)}
              className={cn(
                "block w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-[var(--color-caz-cream-soft)]",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {!query && remaining.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-[var(--color-caz-muted)] hover:text-[var(--color-caz-green-dark)]">
            Browse all ({remaining.length})
          </summary>
          <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-auto">
            {remaining.map((o) => (
              <button
                type="button"
                key={o}
                onClick={() => add(o)}
                className="rounded-full border border-[var(--color-caz-line)] px-2.5 py-0.5 text-xs hover:bg-[var(--color-caz-cream-soft)]"
              >
                + {o}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
