// Resolve the public site URL for use in outbound links (mostly emails).
//
// Preference order:
//   1. NEXT_PUBLIC_SITE_URL — explicit override; always wins when set.
//   2. VERCEL_PROJECT_PRODUCTION_URL — the production domain on Vercel
//      (e.g. "caz-alumni.vercel.app"). Stable across preview deploys, so
//      email links keep working from older messages.
//   3. VERCEL_URL — the per-deployment URL. Useful in preview environments.
//   4. http://localhost:3000 — local dev fallback.
//
// We strip a trailing slash so callers can safely template `${siteUrl}/path`.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod.replace(/\/$/, "")}`;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
