# Caz Alumni Connect

A community portal for alumni of [Cazadero Performing Arts Camp](https://cazadero.org) — find old friends, share Caz memories, and join upcoming alumni events.

Built with **Next.js 15 (App Router) + TypeScript**, **Supabase** (Postgres / Auth / Storage), **Tailwind CSS v4**, and deployed on **Vercel**.

## Features

- **Alumni profiles** — contact info, location, instruments, multi-role history (Camper / Staff / Board) with year ranges and staff positions, avatar upload, opt-in directory visibility.
- **Alumni Directory** — searchable, filter by role / decade / instrument, optional email sharing.
- **Events** — chronological list of upcoming alumni events with cover photos, RSVP "I'm going", attendee list with "see all".
- **Admin** — admin-only event CRUD and admin-role management; first admins are seeded by env var.
- **Auth** — Supabase magic-link email + Google OAuth.
- **Caz brand** — palette and Roboto Slab type drawn from cazadero.org so the portal reads as part of the same family.

## Local development

### 1. Install dependencies
```bash
pnpm install   # or npm/yarn
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then in the SQL editor run the migration:

```
supabase/migrations/0001_init.sql
```

This sets up enums, the `profiles`, `alumni_roles`, `events`, `event_rsvps` tables, picklist allow-lists, RLS policies, the `handle_new_user` trigger, and the `avatars` + `event-covers` storage buckets.

In **Authentication → Providers**:
- Enable **Email** (with magic link)
- Enable **Google** (paste your OAuth credentials)
- Add `http://localhost:3000/auth/callback` and your production callback to the allowed redirect URLs.

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

```ini
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=you@example.org,colleague@example.org
```

`ADMIN_EMAILS` is a comma-separated list — anyone in this list is auto-promoted to admin on their first sign-in.

### 4. Run

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000), sign in (the magic link will arrive in the email you used; in local Supabase dev, also visible in the Inbucket UI), and edit your profile.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import in Vercel; framework auto-detected as Next.js.
3. Set the same environment variables in **Project → Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to your production URL.
4. In Supabase → Authentication → URL Configuration, add the production URL and `https://YOURDOMAIN/auth/callback` to redirect URLs.

## Project layout

```
app/                     Next.js App Router pages + server actions
  page.tsx               Landing
  login/                 Sign-in (magic link + Google)
  auth/callback/         OAuth/magic-link exchange
  profile/               My profile (form + server action)
  directory/             Directory list + [id] detail
  events/                List, [slug] detail, RSVP server action
  admin/                 Admin-only event CRUD + user roles
components/              UI components (cards, forms, multi-select, header/footer)
lib/
  supabase/              SSR-safe Supabase clients + middleware helper
  validators/            Zod schemas shared by forms and server actions
  constants/picklists.ts Single source of truth for instruments & staff positions
  db/types.ts            Hand-curated DB types
  auth.ts                getCurrentProfile / requireUser / requireAdmin
middleware.ts            Refreshes Supabase session, gates protected routes
supabase/migrations/     SQL migration (schema + RLS + triggers + buckets)
public/branding/         Logo (mirrored from assets/branding for static serving)
assets/                  Source brand reference (HTML, logo) — not bundled
```

## Picklists

Both lists are defined once in `lib/constants/picklists.ts` and enforced in the database via the `allowed_instruments` / `allowed_staff_positions` tables (validated by triggers). Adding a value means updating both files.

**Instruments:** Alto Saxophone, Baritone Saxophone, Bass Clarinet, Bass Trombone, Bassoon, Cello, Clarinet, Double Bass, Drumset, Electric Guitar, Euphonium, Flute, French Horn, Guitar, Oboe, Percussion, Piano, Tenor Saxophone, Trombone, Trumpet, Tuba, Viola, Violin, Voice.

**Staff positions:** Assistant Camp Director, Assistant Dining Hall Supervisor, Camp Clerk, Camp Director, CIT, Cook, Counselor, Dean, Dining Hall Supervisor, Executive Director, Faculty, Guest Conductor, Head Chef, Health Officer, Kitchen Crew, Lead Cook, Music Instructor, Office, Office Manager, Prep Cook, Stage Manager, Supervisor, Utility Crew, Other.

## Security notes

- Row-Level Security is enabled on every table. Profile owners can read/write their own row; signed-in users can only read profiles where `show_in_directory = true`; admins can read all.
- Storage buckets `avatars` and `event-covers` are public-read (so `next/image` can serve URLs) but writes are scoped — users can only write under their own UID folder for avatars, and only admins can write event covers.
- Admin actions are gated both at the route layer (`requireAdmin()`) and at the database layer (RLS uses an `is_admin()` helper).
