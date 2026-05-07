import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className="badge badge-gold">Admin</span>
        <nav className="flex gap-1">
          <Link href="/admin/events" className="rounded px-2 py-1 hover:bg-[var(--color-caz-cream-soft)]">Events</Link>
          <Link href="/admin/users" className="rounded px-2 py-1 hover:bg-[var(--color-caz-cream-soft)]">Users</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
