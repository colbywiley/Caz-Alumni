import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, display_name, is_admin, show_in_directory")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`email.ilike.${term},full_name.ilike.${term},display_name.ilike.${term}`);
  }
  const { data: profiles } = await query;

  return (
    <div>
      <h1 className="text-3xl">Users</h1>
      <p className="mt-2 text-[var(--color-caz-muted)]">Promote or demote admins. Search by email or name.</p>
      <form className="mt-4">
        <input name="q" defaultValue={q ?? ""} placeholder="Search…" className="input max-w-sm" />
      </form>
      <div className="mt-6">
        <AdminUsersTable
          profiles={(profiles ?? []).map((p) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            display_name: p.display_name,
            is_admin: p.is_admin,
            show_in_directory: p.show_in_directory,
          }))}
        />
      </div>
    </div>
  );
}
