import Link from "next/link";

type Props = {
  current: "friends" | "all";
};

export function FeedFilter({ current }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold transition";

  function tabClass(isActive: boolean) {
    return isActive
      ? `${base} bg-[var(--color-caz-green)] shadow-sm`
      : `${base} bg-white hover:bg-[var(--color-caz-cream-soft)]`;
  }

  // The global `a { color }` rule wins over Tailwind's `text-*` utilities here
  // (same specificity, but the user agent stylesheet load order applies the
  // tag rule last for unstyled links). Inline-style the active link to force
  // a guaranteed-readable foreground.
  const activeColor = "#ffffff";
  const inactiveColor = "var(--color-caz-green-dark)";

  return (
    <div
      role="tablist"
      aria-label="Feed filter"
      className="inline-flex gap-1 rounded-lg border border-[var(--color-caz-line)] bg-white p-1"
    >
      <Link
        role="tab"
        aria-selected={current === "friends"}
        href="/feed?filter=friends"
        className={tabClass(current === "friends")}
        style={{ color: current === "friends" ? activeColor : inactiveColor }}
      >
        My Friends
      </Link>
      <Link
        role="tab"
        aria-selected={current === "all"}
        href="/feed?filter=all"
        className={tabClass(current === "all")}
        style={{ color: current === "all" ? activeColor : inactiveColor }}
      >
        All
      </Link>
    </div>
  );
}
