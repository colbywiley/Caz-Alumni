"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAdminAction } from "@/app/admin/users/actions";

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  is_admin: boolean;
  show_in_directory: boolean;
};

export function AdminUsersTable({ profiles }: { profiles: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(p: Row) {
    startTransition(async () => {
      await setAdminAction(p.id, !p.is_admin);
      router.refresh();
    });
  }

  if (profiles.length === 0) {
    return <div className="card p-6 text-[var(--color-caz-muted)]">No matching users.</div>;
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-caz-cream-soft)] text-xs uppercase tracking-wider text-[var(--color-caz-muted)]">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Directory</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-caz-line)]">
          {profiles.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">{p.display_name || p.full_name || "—"}</td>
              <td className="px-4 py-3">{p.email}</td>
              <td className="px-4 py-3">{p.show_in_directory ? "Yes" : "—"}</td>
              <td className="px-4 py-3">
                {p.is_admin ? <span className="badge badge-gold">Admin</span> : <span className="text-[var(--color-caz-muted)]">—</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className={p.is_admin ? "btn btn-secondary" : "btn btn-primary"}
                  onClick={() => toggle(p)}
                  disabled={pending}
                >
                  {p.is_admin ? "Revoke admin" : "Make admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
