import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { FriendsList } from "@/components/directory/FriendsList";
import type { FriendshipRow, ProfileRow } from "@/lib/db/types";

export const metadata = { title: "My Profile · Caz Alumni Connect" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/profile");

  const supabase = await createSupabaseServerClient();
  const { data: roles } = await supabase
    .from("alumni_roles")
    .select("*")
    .eq("profile_id", profile.id)
    .order("role", { ascending: true });

  const { data: friendLinksRaw } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", profile.id);
  const friendIds = ((friendLinksRaw ?? []) as Pick<FriendshipRow, "friend_id">[]).map(
    (r) => r.friend_id,
  );
  let friends: ProfileRow[] = [];
  if (friendIds.length > 0) {
    const { data: friendProfilesRaw } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds)
      .order("full_name", { ascending: true });
    friends = (friendProfilesRaw ?? []) as ProfileRow[];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl">My alumni profile</h1>
      <p className="mt-2 text-[var(--color-caz-muted)]">
        Tell fellow alumni who you are and when you were at Caz. Choose whether to appear in the
        public Alumni Directory and whether to share your email.
      </p>
      <div className="mt-8">
        <ProfileForm profile={profile} roles={roles ?? []} />
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">My friends</h2>
        <FriendsList
          friends={friends}
          emptyMessage="You haven't added any friends yet. Visit the directory to add some."
        />
      </section>
    </div>
  );
}
