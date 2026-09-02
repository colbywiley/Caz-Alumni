# Migrating Caz Alumni Connect to WordPress / BuddyPress

Plan of record for retiring this Next.js + Supabase prototype and rebuilding the
alumni portal on WordPress, alongside the existing cazadero.org site.

**No data migrates.** This was a prototype; the WordPress build starts empty.

| | |
|---|---|
| Approach | BuddyPress + The Events Calendar |
| Effort | 2–3 weeks (~40–60 hours, part-time) |
| Running cost | $170–450/year |
| Custom code | 2 features; everything else is configuration |

## Why BuddyPress

This app's feature set is almost exactly what BuddyPress does natively: profiles,
member directory, activity feed with likes/comments, @mentions, friend
connections, notifications bell.

Two findings drove the decision:

1. **cazadero.org already runs WordPress** (The7, Revolution Slider, Yoast, WP
   Rocket) — see `assets/reference/`. This consolidates onto a known CMS.
2. **`alumni_roles` is not a repeater.** `unique (profile_id, role)` against a
   3-value enum (`0001_init.sql:96`) means each member has at most 3 role rows.
   BuddyPress profiles have no repeater support — normally a blocker — but this
   flattens into 8 fixed fields.

## What skipping the data migration does and doesn't solve

Removes: array-column conversion, UUID→integer ID mapping, the whole ETL step,
and auth migration (magic-link + Google meant no password hashes anyway).

Does **not** remove: the privacy/security model (51 RLS policies become plugin
config, verified by hand) or the hosting cost. Phases 4 and 9 exist for these.

## Three decisions to make first

1. **Separate install, not a subsite.** Recommend `alumni.cazadero.org` on its
   own WordPress. The7 + Revolution Slider + WP Rocket is heavy and BuddyPress
   template conflicts with page-builder themes are common. An alumni-feed bug
   must not be able to take down camp registration.
2. **Hosting.** Cloudways (~$14/mo) if someone technical owns updates; WP Engine
   (~$25–30/mo) if nobody will.
3. **Admins.** No `ADMIN_EMAILS` equivalent — name two people and assign the
   Administrator role by hand in wp-admin.

## Phases

### 1. Foundation (½ day)
- Provision hosting, point `alumni.cazadero.org`, issue TLS.
- Install WordPress. **Permalinks → Post name** (BuddyPress requires this).
- Create a staging environment; build there, not live.
- Timezone → America/Los_Angeles.

### 2. BuddyPress components (½ day)
- Enable: Extended Profiles, Account Settings, Activity Streams, Notifications,
  Friend Connections, Member Types.
- Leave off: Groups, Private Messaging, Site Tracking (none are in this app).
- Registration: open with email confirmation.

### 3. Member profiles (1–2 days)

Base group — from `profiles`:

| Prototype column | WordPress field | Type | Notes |
|---|---|---|---|
| `email` | WP user email | built in | not an xProfile field |
| `full_name` | Name | built in | BP base field, required |
| `display_name` | Display name | built in | WP user setting |
| `phone` | Phone | Text | default visibility **Only Me** |
| `city`/`state`/`country` | City / State / Country | Text ×3 | keep separate for filtering |
| `bio` | About you | Multi-line text | |
| `avatar_url` | Profile photo | built in | |
| `instruments[]` | Instruments | Multi-select | all 24 values as options |
| `share_email_in_directory` | Email visibility | built in | per-field visibility |
| `show_in_directory` | — | **no equivalent** | built in Phase 9 |
| `is_admin` | WP role | built in | Administrator |
| `notify_on_*` | Settings → Notifications | built in | |

Caz History group — `alumni_roles` flattened:

| Field | Type | Options |
|---|---|---|
| Camper — first year | Dropdown | 1957–2027 |
| Camper — last year | Dropdown | 1957–2027 |
| Staff — first year | Dropdown | 1957–2027 |
| Staff — last year | Dropdown | 1957–2027 |
| Staff positions | Multi-select | all 24 staff positions |
| Staff position (other) | Text | free text |
| Board — first year | Dropdown | 1957–2027 |
| Board — last year | Dropdown | 1957–2027 |

Two constraints come free: multi-select option lists replace the
`allowed_instruments` / `allowed_staff_positions` validation triggers, and
Dropdown year fields replace the `1957 – present` CHECK constraints.

Source both lists from `lib/constants/picklists.ts` — don't retype from memory.

### 4. Directory and privacy (1–2 days)
- Install **BP Profile Search**; build a search form over the members directory.
- Searchable: Instruments, Staff positions, City, State, year fields.
  Year fields as a **range** search reproduce the decade filter.
- Default sort alphabetical, not "last active".

> **Privacy:** this app defaulted `show_in_directory` and
> `share_email_in_directory` to `false`, enforced by Postgres. BuddyPress lists
> every member by default and enforces nothing at the storage layer. Do not
> invite anyone before the Phase 9 opt-out ships.

### 5. Sign-in (½ day)
- **Login Me Now** (magic link + Google in one), or a magic-link plugin plus
  **Nextend Social Login**.
- Google OAuth credentials with `https://alumni.cazadero.org` as authorized origin.
- Post-login redirect → activity feed (matches current behavior).
- Replace or restyle `wp-login.php` so members never see stock WP chrome.

### 6. Events (1 day)

**The Events Calendar** + **Event Tickets** (both free). Event Tickets RSVP has
Going / Not Going, matching the `rsvp_status` enum exactly.

| Prototype | The Events Calendar |
|---|---|
| `slug` | Event permalink |
| `title` | Event title |
| `description` | Event content |
| `location` | Venue |
| `start_at` / `end_at` | Start & end date-time |
| `external_url` | Event website |
| `cover_image_url` | Featured image |
| `created_by` | Post author |
| `event_rsvps` | Event Tickets RSVP |

Restrict event creation to Administrators (replaces admin-only event CRUD).

### 7. Feed, photos, notifications (1 day)

| Prototype | BuddyPress | Status |
|---|---|---|
| `feed_posts` | Activity update | native |
| `feed_post_likes` | Favorites | native |
| `feed_post_comments` | Activity comments | native |
| `@[Name](uuid)` | @mentions | native |
| `notifications` | Notifications | native |
| `friendships` | Friend Connections | **semantics differ** |
| `image_urls[]` | rtMedia or WPMediaVerse | add-on |

> **Friending changes.** `friendships(user_id, friend_id)` is a one-way follow —
> no approval. BuddyPress Friend Connections are mutual (request + accept).
> Mutual arguably suits an alumni network better, but it is a visible change.
> Use a follow plugin instead if one-way semantics matter.

Email: **WP Mail SMTP** pointed at the existing Resend account and API key.
Verify the sending domain or notifications land in spam.

### 8. Brand it (2–4 days)
- BuddyPress-compatible theme matching cazadero.org — don't run The7 here.
- Palette from the live site: `#75a15a`, `#548636` on `#f2f4e8`; Roboto Slab headings.
- Cross-link both directions between the main site and the portal.
- Check the directory and feed on a phone; both are dense.

### 9. The two things you must build (2–3 days)

Small custom plugin, `caz-alumni-extras`:

**Directory opt-out — required before launch.** Reproduces `show_in_directory`
(defaulted `false`). Profile checkbox plus a `bp_pre_user_query` filter
excluding members who haven't opted in. ~40 lines.

> The checkbox must default to **unchecked**. A member who never touches their
> settings must not appear in a searchable directory. Getting this backwards is
> the most damaging mistake available in this migration.

**The @cazalumni broadcast.** Hook `bp_activity_after_save`, detect the token,
check `current_user_can('manage_options')`, fan out via
`bp_notifications_add_notification()`. Strip the token silently for non-admins,
as `stripCazAlumniMention()` does today. Queue the fan-out rather than sending
inline. ~60 lines.

## Pre-launch privacy checklist

51 RLS policies were enforced by Postgres. WordPress enforces none of that at the
storage layer. Work through this **signed in as a non-admin test member**:

- [ ] A new member is not in the directory until they opt in.
- [ ] Email addresses hidden unless the member made that field visible.
- [ ] Phone numbers are Only Me by default.
- [ ] Logged-out visitors see nothing — check in a private window.
- [ ] Only Administrators can create or edit events.
- [ ] Only Administrators can post @cazalumni; non-admin attempts are stripped.
- [ ] A member can delete their own posts/comments, and no one else's.
- [ ] Uploads directory has no open index.
- [ ] Notification emails arrive and are not marked spam.

## Launch and decommission

1. Soft-launch to 5–6 alumni who'll tell you the truth. One week.
2. Fix what they report, then announce broadly.
3. Delete the Vercel project; **pause** (don't delete) the Supabase project.
4. Archive this repo. `supabase/migrations/0001_init.sql` and
   `lib/constants/picklists.ts` are the best written record of intended behavior.

## Running cost

| Item | Annual | Notes |
|---|---|---|
| Hosting | $170–420 | Cloudways low, WP Engine/Kinsta high |
| BuddyPress | free | |
| BP Profile Search | free | |
| The Events Calendar + Event Tickets | free | |
| Photo uploads | free | rtMedia or WPMediaVerse |
| Sign-in | free | Nextend Pro ~$49 if more providers needed |
| Email | free | existing Resend account |
| Theme | $0–80 | only if bought rather than adapted |

**~$170–450/year**, a real increase over the near-zero free tiers today. The
tradeoff is a system camp staff can administer themselves with no application
code to maintain.

BuddyBoss would add $299–399/year and forfeit most of the free add-on ecosystem,
which is why this plan doesn't use it.

---

Plugin availability and pricing verified September 2026; confirm before committing.
