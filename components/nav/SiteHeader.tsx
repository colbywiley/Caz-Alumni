"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { ProfileRow } from "@/lib/db/types";

export function SiteHeader({ profile }: { profile: ProfileRow | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape, and close automatically when viewport grows past the
  // mobile breakpoint so we never leave the panel hanging open behind the
  // desktop nav.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const linkBase =
    "rounded px-3 py-2 font-medium hover:bg-[var(--color-caz-cream-soft)]";

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        <Link href="/directory" onClick={onNavigate} className={`${linkBase} text-[var(--color-caz-ink)]`}>
          Directory
        </Link>
        <Link href="/events" onClick={onNavigate} className={`${linkBase} text-[var(--color-caz-ink)]`}>
          Events
        </Link>
        <a
          href="https://cazadero.secure.nonprofitsoapbox.com/donate"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={`${linkBase} text-[var(--color-caz-gold)]`}
        >
          Donate
        </a>
        {profile && (
          <Link href="/profile" onClick={onNavigate} className={`${linkBase} text-[var(--color-caz-ink)]`}>
            My Profile
          </Link>
        )}
        {profile?.is_admin && (
          <Link href="/admin/events" onClick={onNavigate} className={`${linkBase} text-[var(--color-caz-gold)]`}>
            Admin
          </Link>
        )}
      </>
    );
  }

  return (
    <header className="border-b border-[var(--color-caz-line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3">
          <Image
            src="/branding/cazadero-music-camp-logo.png"
            alt="Cazadero Music Camp"
            width={220}
            height={48}
            priority
            className="h-10 w-auto"
          />
          <span className="hidden text-sm font-semibold uppercase tracking-wider text-[var(--color-caz-green-dark)] lg:inline">
            Alumni Connect
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLinks />
          {profile ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="btn btn-primary ml-2">
              Sign In
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-caz-line)] text-[var(--color-caz-green-darker)] hover:bg-[var(--color-caz-cream-soft)] md:hidden"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav
          id="site-mobile-menu"
          className="border-t border-[var(--color-caz-line)] bg-white px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1 text-base">
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-2 border-t border-[var(--color-caz-line)] pt-3">
              {profile ? (
                <LogoutButton />
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
