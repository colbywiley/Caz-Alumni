-- Per-profile notification preferences and in-app notifications.
-- The boolean prefs control whether we send emails. In-app bell notifications
-- are recorded regardless of email preference so users can always review them.

alter table public.profiles
  add column if not exists notify_on_friend_add boolean not null default true,
  add column if not exists notify_on_photo_tag  boolean not null default true,
  add column if not exists notify_on_post_tag   boolean not null default true;

-- ===========================================================================
-- Notifications (in-app bell feed)
-- ===========================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- The recipient: this is the profile that should see the bell badge.
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- The actor who caused the notification (e.g. the friender / tagger).
  actor_id uuid references public.profiles(id) on delete set null,
  -- Discriminator. New event types go here as the app grows.
  type text not null check (type in ('friend_added', 'photo_tag', 'post_tag')),
  -- Free-form payload for future fields (post id, photo id, etc.).
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Users can see their own notifications.
create policy "user reads own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can mark their own notifications as read (or delete them).
create policy "user updates own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user deletes own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Anyone signed in can create a notification, but only with themselves as the
-- actor. The recipient (user_id) can be anyone — that's the whole point.
create policy "signed-in user creates notification as actor"
  on public.notifications for insert
  with check (auth.uid() is not null and actor_id = auth.uid());
