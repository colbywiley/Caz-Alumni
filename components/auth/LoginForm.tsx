"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signInGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <div className="mb-2 text-4xl">📨</div>
        <h2 className="text-xl">Check your email</h2>
        <p className="mt-2 text-[var(--color-caz-muted)]">
          We just sent a sign-in link to <span className="font-semibold text-[var(--color-caz-ink)]">{email}</span>.
          Click the link in the email to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={sendMagicLink} className="space-y-3">
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
          <p className="help">We&apos;ll email you a one-tap sign-in link — no password needed.</p>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--color-caz-muted)]">
        <div className="divider flex-1" />
        or
        <div className="divider flex-1" />
      </div>

      <button onClick={signInGoogle} className="btn btn-secondary w-full">
        Continue with Google
      </button>
    </div>
  );
}
