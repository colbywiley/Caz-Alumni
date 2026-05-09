import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in · Caz Alumni Connect" };

type SearchParams = Promise<{ next?: string }>;

function safeNext(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(safeNext(next));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl">Welcome back to Caz</h1>
      <p className="mt-2 text-[var(--color-caz-muted)]">
        Sign in with email or Google to access the directory, your profile, and upcoming alumni events.
      </p>
      <div className="card mt-8 p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
