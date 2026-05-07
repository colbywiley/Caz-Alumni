-- Friendships: a signed-in user can add another alum as a friend.
-- Directional: (user_id) added (friend_id) to their friends list.

create table public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create index friendships_friend_idx on public.friendships (friend_id);

alter table public.friendships enable row level security;

create policy "signed-in read friendships"
  on public.friendships for select
  using (auth.uid() is not null);

create policy "user adds own friend"
  on public.friendships for insert
  with check (user_id = auth.uid());

create policy "user removes own friend"
  on public.friendships for delete
  using (user_id = auth.uid());
