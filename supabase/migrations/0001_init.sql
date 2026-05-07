-- Caz Alumni Connect — initial schema
-- Run via Supabase CLI (`supabase db reset`) or paste into the Supabase SQL editor.

-- Extensions
create extension if not exists "pgcrypto";

-- ===========================================================================
-- Enums
-- ===========================================================================

create type alumni_role as enum ('camper', 'staff', 'board');
create type rsvp_status as enum ('going', 'not_going');

-- ===========================================================================
-- Picklist allowlists (mirrored in lib/constants/picklists.ts)
-- ===========================================================================

create table public.allowed_instruments (name text primary key);
insert into public.allowed_instruments (name) values
  ('Alto Saxophone'),('Baritone Saxophone'),('Bass Clarinet'),('Bass Trombone'),
  ('Bassoon'),('Cello'),('Clarinet'),('Double Bass'),('Drumset'),('Electric Guitar'),
  ('Euphonium'),('Flute'),('French Horn'),('Guitar'),('Oboe'),('Percussion'),
  ('Piano'),('Tenor Saxophone'),('Trombone'),('Trumpet'),('Tuba'),('Viola'),
  ('Violin'),('Voice');

create table public.allowed_staff_positions (name text primary key);
insert into public.allowed_staff_positions (name) values
  ('Assistant Camp Director'),('Assistant Dining Hall Supervisor'),('Camp Clerk'),
  ('Camp Director'),('CIT'),('Cook'),('Counselor'),('Dean'),
  ('Dining Hall Supervisor'),('Executive Director'),('Faculty'),('Guest Conductor'),
  ('Head Chef'),('Health Officer'),('Kitchen Crew'),('Lead Cook'),('Music Instructor'),
  ('Office'),('Office Manager'),('Prep Cook'),('Stage Manager'),('Supervisor'),
  ('Utility Crew'),('Other');

-- ===========================================================================
-- Profiles
-- ===========================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  display_name text,
  phone text,
  city text,
  state text,
  country text,
  bio text,
  avatar_url text,
  instruments text[] not null default '{}',
  show_in_directory boolean not null default false,
  share_email_in_directory boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_directory_idx on public.profiles (show_in_directory) where show_in_directory;
create index profiles_email_idx on public.profiles (lower(email));

-- Validate that every instrument value is allowed
create or replace function public.validate_profile_instruments()
returns trigger language plpgsql as $$
declare
  bad text;
begin
  if new.instruments is not null and array_length(new.instruments, 1) > 0 then
    select i into bad
    from unnest(new.instruments) as i
    where i not in (select name from public.allowed_instruments)
    limit 1;
    if bad is not null then
      raise exception 'Invalid instrument: %', bad;
    end if;
  end if;
  return new;
end $$;

create trigger profiles_validate_instruments
before insert or update of instruments on public.profiles
for each row execute function public.validate_profile_instruments();

-- ===========================================================================
-- Alumni roles
-- ===========================================================================

create table public.alumni_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role alumni_role not null,
  start_year int,
  end_year int,
  positions text[] not null default '{}',
  other_position text,
  created_at timestamptz not null default now(),
  unique (profile_id, role),
  check (start_year is null or (start_year between 1957 and extract(year from now())::int + 1)),
  check (end_year is null or (end_year between 1957 and extract(year from now())::int + 1)),
  check (end_year is null or start_year is null or end_year >= start_year)
);

create index alumni_roles_profile_idx on public.alumni_roles (profile_id);

create or replace function public.validate_alumni_role_positions()
returns trigger language plpgsql as $$
declare bad text;
begin
  if new.role <> 'staff' and new.positions is not null and array_length(new.positions, 1) > 0 then
    raise exception 'positions only allowed when role = staff';
  end if;
  if new.role = 'staff' and new.positions is not null and array_length(new.positions, 1) > 0 then
    select p into bad
    from unnest(new.positions) as p
    where p not in (select name from public.allowed_staff_positions)
    limit 1;
    if bad is not null then
      raise exception 'Invalid staff position: %', bad;
    end if;
  end if;
  if new.positions @> array['Other']::text[] and (new.other_position is null or length(trim(new.other_position)) = 0) then
    raise exception 'other_position is required when "Other" is selected';
  end if;
  return new;
end $$;

create trigger alumni_roles_validate_positions
before insert or update on public.alumni_roles
for each row execute function public.validate_alumni_role_positions();

-- ===========================================================================
-- Events & RSVPs
-- ===========================================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  external_url text,
  cover_image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create index events_start_at_idx on public.events (start_at);

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index event_rsvps_event_idx on public.event_rsvps (event_id);

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- ===========================================================================
-- Auto-create profile row when a new auth user signs up
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===========================================================================
-- Helper: is_admin() — uses session user
-- ===========================================================================

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.alumni_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.allowed_instruments enable row level security;
alter table public.allowed_staff_positions enable row level security;

-- Public read for picklists (so even the login page can hint values if needed)
create policy "picklists readable to all"
  on public.allowed_instruments for select using (true);
create policy "positions readable to all"
  on public.allowed_staff_positions for select using (true);

-- profiles
create policy "profile owner can read self"
  on public.profiles for select
  using (auth.uid() = id);

create policy "directory readable when opted in"
  on public.profiles for select
  using (show_in_directory = true and auth.uid() is not null);

create policy "admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "profile owner can update self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from public.profiles where id = auth.uid()));

create policy "admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- alumni_roles
create policy "owner reads own roles"
  on public.alumni_roles for select
  using (profile_id = auth.uid());

create policy "directory roles readable to signed-in"
  on public.alumni_roles for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = alumni_roles.profile_id and p.show_in_directory = true
    )
  );

create policy "admins read all roles"
  on public.alumni_roles for select
  using (public.is_admin());

create policy "owner mutates own roles"
  on public.alumni_roles for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- events: signed-in users read all; admins write
create policy "signed-in read events"
  on public.events for select
  using (auth.uid() is not null);

create policy "admins insert events"
  on public.events for insert
  with check (public.is_admin());

create policy "admins update events"
  on public.events for update
  using (public.is_admin()) with check (public.is_admin());

create policy "admins delete events"
  on public.events for delete
  using (public.is_admin());

-- event_rsvps: signed-in see all; users write own
create policy "signed-in read rsvps"
  on public.event_rsvps for select
  using (auth.uid() is not null);

create policy "user writes own rsvp"
  on public.event_rsvps for insert
  with check (profile_id = auth.uid());

create policy "user updates own rsvp"
  on public.event_rsvps for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "user deletes own rsvp"
  on public.event_rsvps for delete
  using (profile_id = auth.uid());

-- ===========================================================================
-- Storage buckets
-- ===========================================================================

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Avatars: public read; users can write only inside a folder named with their uid.
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Event covers: public read; only admins write.
create policy "event covers public read"
  on storage.objects for select
  using (bucket_id = 'event-covers');

create policy "event covers admin write"
  on storage.objects for insert
  with check (bucket_id = 'event-covers' and public.is_admin());

create policy "event covers admin update"
  on storage.objects for update
  using (bucket_id = 'event-covers' and public.is_admin());

create policy "event covers admin delete"
  on storage.objects for delete
  using (bucket_id = 'event-covers' and public.is_admin());
