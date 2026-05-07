"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ALUMNI_ROLES, INSTRUMENTS } from "@/lib/constants/picklists";

export function DirectoryFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    startTransition(() => router.replace(`/directory?${next.toString()}`));
  }

  const decades = [];
  const thisDecade = Math.floor(new Date().getFullYear() / 10) * 10;
  for (let d = thisDecade; d >= 1950; d -= 10) decades.push(d);

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="q">Search by name</label>
        <input
          id="q"
          className="input"
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          placeholder="Type a name…"
        />
      </div>
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select id="role" className="select" value={params.get("role") ?? ""} onChange={(e) => update("role", e.target.value)}>
          <option value="">All</option>
          {ALUMNI_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="decade">Decade</label>
        <select id="decade" className="select" value={params.get("decade") ?? ""} onChange={(e) => update("decade", e.target.value)}>
          <option value="">Any</option>
          {decades.map((d) => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="instrument">Instrument</label>
        <select id="instrument" className="select" value={params.get("instrument") ?? ""} onChange={(e) => update("instrument", e.target.value)}>
          <option value="">Any</option>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      {pending && <div className="text-xs text-[var(--color-caz-muted)]">Filtering…</div>}
    </div>
  );
}
