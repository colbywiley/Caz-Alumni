export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-caz-line)] bg-[var(--color-caz-green-darker)] text-[var(--color-caz-cream-soft)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center">
        <div>
          <div className="font-display text-lg font-semibold text-white">Caz Alumni Connect</div>
          <div className="text-sm text-white/75">
            A community space for alumni of Cazadero Performing Arts Camp.
          </div>
        </div>
        <div className="text-sm">
          <a
            href="https://cazadero.org"
            className="text-white/90 hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            cazadero.org →
          </a>
        </div>
      </div>
    </footer>
  );
}
