-- Social feed: posts, likes, comments, plus the storage bucket for inline photos.
-- Mentions inside post / comment content are stored as @[Display Name](uuid)
-- markers in the content text; the server parses them on submit to fan out
-- notifications and emails.

-- ===========================================================================
-- Posts
-- ===========================================================================

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Either text or at least one image is required.
  check (length(trim(content)) > 0 or array_length(image_urls, 1) > 0)
);

create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_author_idx  on public.feed_posts (author_id, created_at desc);

create trigger feed_posts_set_updated_at
before update on public.feed_posts
for each row execute function public.set_updated_at();

-- ===========================================================================
-- Likes
-- ===========================================================================

create table if not exists public.feed_post_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index if not exists feed_post_likes_post_idx on public.feed_post_likes (post_id);

-- ===========================================================================
-- Comments
-- ===========================================================================

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists feed_post_comments_post_idx on public.feed_post_comments (post_id, created_at);

-- ===========================================================================
-- Notification type: add 'comment_tag'
-- ===========================================================================

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('friend_added', 'photo_tag', 'post_tag', 'comment_tag'));

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.feed_posts          enable row level security;
alter table public.feed_post_likes     enable row level security;
alter table public.feed_post_comments  enable row level security;

-- Posts: any signed-in alum can read. Authors can insert/update/delete their own.
create policy "signed-in read posts"
  on public.feed_posts for select
  using (auth.uid() is not null);

create policy "author inserts post"
  on public.feed_posts for insert
  with check (author_id = auth.uid());

create policy "author updates own post"
  on public.feed_posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "author deletes own post"
  on public.feed_posts for delete
  using (author_id = auth.uid());

create policy "admins delete any post"
  on public.feed_posts for delete
  using (public.is_admin());

-- Likes: anyone signed in reads; users own their like rows.
create policy "signed-in read likes"
  on public.feed_post_likes for select
  using (auth.uid() is not null);

create policy "user adds own like"
  on public.feed_post_likes for insert
  with check (profile_id = auth.uid());

create policy "user removes own like"
  on public.feed_post_likes for delete
  using (profile_id = auth.uid());

-- Comments: anyone signed in reads; users insert as themselves; users delete own;
-- post authors can also delete comments on their own posts; admins delete any.
create policy "signed-in read comments"
  on public.feed_post_comments for select
  using (auth.uid() is not null);

create policy "author inserts comment"
  on public.feed_post_comments for insert
  with check (author_id = auth.uid());

create policy "author deletes own comment"
  on public.feed_post_comments for delete
  using (author_id = auth.uid());

create policy "post author deletes comments on own post"
  on public.feed_post_comments for delete
  using (
    exists (
      select 1 from public.feed_posts p
      where p.id = feed_post_comments.post_id and p.author_id = auth.uid()
    )
  );

create policy "admins delete any comment"
  on public.feed_post_comments for delete
  using (public.is_admin());

-- ===========================================================================
-- Storage bucket for feed images
-- ===========================================================================

insert into storage.buckets (id, name, public) values
  ('feed-images', 'feed-images', true)
on conflict (id) do nothing;

create policy "feed images public read"
  on storage.objects for select
  using (bucket_id = 'feed-images');

create policy "feed images owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'feed-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feed images owner update"
  on storage.objects for update
  using (
    bucket_id = 'feed-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feed images owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'feed-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
