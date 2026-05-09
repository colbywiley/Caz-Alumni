// Resolve the public site URL for use in outbound links (mostly emails).
//
// Preference order:
//   1. NEXT_PUBLIC_SITE_URL — explicit override; always wins when set.
//      Recommended on Vercel deployments with a custom domain so emails
//      consistently link to the canonical host (e.g. https://cazalumni.org)
//      instead of *.vercel.app.
//   2. VERCEL_PROJECT_PRODUCTION_URL — a production domain on Vercel.
//      For projects with a custom domain this is usually the custom domain;
//      we keep it but only after the explicit override.
//   3. VERCEL_URL — the per-deployment URL. Useful in preview environments.
//   4. http://localhost:3000 — local dev fallback.
//
// We strip a trailing slash so callers can safely template `${siteUrl}/path`.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalize(explicit);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return ensureProtocol(prod);

  const vercel = process.env.VERCEL_URL;
  if (vercel) return ensureProtocol(vercel);

  return "http://localhost:3000";
}

function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ensureProtocol(host: string): string {
  return `https://${host.replace(/^https?:\/\//i, "").replace(/\/$/, "")}`;
}
