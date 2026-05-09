import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/profile", "/directory", "/events", "/admin"];
const ADMIN_PREFIX = "/admin";

export async function updateSession(request: NextRequest) {
  // Supabase's magic-link / OAuth flow sometimes lands users at the bare site
  // URL with `?code=...` (when our `redirectTo` isn't in the project's allow-
  // list, Supabase falls back to the Site URL). Forward those requests to
  // `/auth/callback` so the session exchange always runs.
  const incoming = request.nextUrl;
  if (
    incoming.searchParams.has("code") &&
    incoming.pathname !== "/auth/callback"
  ) {
    const forward = incoming.clone();
    if (!forward.searchParams.has("next")) {
      const fallback =
        incoming.pathname === "/" ? "/feed" : incoming.pathname;
      forward.searchParams.set("next", fallback);
    }
    forward.pathname = "/auth/callback";
    return NextResponse.redirect(forward);
  }

  // Likewise surface Supabase auth errors on /login instead of leaving them
  // as ugly query params on the landing page.
  if (
    incoming.searchParams.has("error_code") &&
    incoming.pathname !== "/login"
  ) {
    const forward = incoming.clone();
    forward.pathname = "/login";
    return NextResponse.redirect(forward);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith(ADMIN_PREFIX) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!(profile as { is_admin?: boolean } | null)?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
