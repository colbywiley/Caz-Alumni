import Link from "next/link";

type Props = {
  current: "friends" | "all";
};

export function FeedFilter({ current }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition";
  const active =
    "bg-[var(--color-caz-green)] text-white";
  const inactive =
    "bg-white text-[var(--color-caz-green-dark)] hover:bg-[var(--color-caz-cream-soft)]";

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
        className={`${base} ${current === "friends" ? active : inactive}`}
      >
        My Friends
      </Link>
      <Link
        role="tab"
        aria-selected={current === "all"}
        href="/feed?filter=all"
        className={`${base} ${current === "all" ? active : inactive}`}
      >
        All
      </Link>
    </div>
  );
}
