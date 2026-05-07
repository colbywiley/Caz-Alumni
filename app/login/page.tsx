import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · Caz Alumni Connect" };

export default function LoginPage() {
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
