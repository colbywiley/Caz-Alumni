import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { ProfileRow } from "@/lib/db/types";

export function SiteHeader({ profile }: { profile: ProfileRow | null }) {
  return (
    <header className="border-b border-[var(--color-caz-line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/branding/cazadero-music-camp-logo.png"
            alt="Cazadero Music Camp"
            width={220}
            height={48}
            priority
            className="h-10 w-auto"
          />
          <span className="hidden text-sm font-semibold uppercase tracking-wider text-[var(--color-caz-green-dark)] sm:inline">
            Alumni Connect
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/directory" className="rounded px-3 py-2 font-medium text-[var(--color-caz-ink)] hover:bg-[var(--color-caz-cream-soft)]">
            Directory
          </Link>
          <Link href="/events" className="rounded px-3 py-2 font-medium text-[var(--color-caz-ink)] hover:bg-[var(--color-caz-cream-soft)]">
            Events
          </Link>
          <a
            href="https://cazadero.secure.nonprofitsoapbox.com/donate"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-3 py-2 font-medium text-[var(--color-caz-gold)] hover:bg-[var(--color-caz-cream-soft)]"
          >
            Donate
          </a>
          {profile && (
            <Link href="/profile" className="rounded px-3 py-2 font-medium text-[var(--color-caz-ink)] hover:bg-[var(--color-caz-cream-soft)]">
              My Profile
            </Link>
          )}
          {profile?.is_admin && (
            <Link href="/admin/events" className="rounded px-3 py-2 font-medium text-[var(--color-caz-gold)] hover:bg-[var(--color-caz-cream-soft)]">
              Admin
            </Link>
          )}
          {profile ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="btn btn-primary ml-2">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
