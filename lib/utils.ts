import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function formatYearRange(start: number | null, end: number | null): string {
  if (!start && !end) return "";
  if (start && !end) return `${start}–present`;
  if (!start && end) return `${end}`;
  if (start === end) return `${start}`;
  return `${start}–${end}`;
}

export function initialsFromName(name: string | null | undefined, fallback = "C"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

export const EVENT_TIME_ZONE = "America/Los_Angeles";

export function formatEventDateTime(
  iso: string | Date,
  opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  },
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: EVENT_TIME_ZONE }).format(date);
}

export function formatEventTime(iso: string | Date): string {
  return formatEventDateTime(iso, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
