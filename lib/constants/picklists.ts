// Single source of truth for pickable values shown in forms and the directory.
// Keep aligned with `supabase/migrations/0001_init.sql` allow-list tables.

export const INSTRUMENTS = [
  "Alto Saxophone",
  "Baritone Saxophone",
  "Bass Clarinet",
  "Bass Trombone",
  "Bassoon",
  "Cello",
  "Clarinet",
  "Double Bass",
  "Drumset",
  "Electric Guitar",
  "Euphonium",
  "Flute",
  "French Horn",
  "Guitar",
  "Oboe",
  "Percussion",
  "Piano",
  "Tenor Saxophone",
  "Trombone",
  "Trumpet",
  "Tuba",
  "Viola",
  "Violin",
  "Voice",
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const STAFF_POSITIONS = [
  "Assistant Camp Director",
  "Assistant Dining Hall Supervisor",
  "Camp Clerk",
  "Camp Director",
  "CIT",
  "Cook",
  "Counselor",
  "Dean",
  "Dining Hall Supervisor",
  "Executive Director",
  "Faculty",
  "Guest Conductor",
  "Head Chef",
  "Health Officer",
  "Kitchen Crew",
  "Lead Cook",
  "Music Instructor",
  "Office",
  "Office Manager",
  "Prep Cook",
  "Stage Manager",
  "Supervisor",
  "Utility Crew",
  "Other",
] as const;
export type StaffPosition = (typeof STAFF_POSITIONS)[number];

export const ALUMNI_ROLES = [
  { value: "camper", label: "Former Camper" },
  { value: "staff", label: "Former Staff" },
  { value: "board", label: "Former Board" },
] as const;
export type AlumniRoleValue = (typeof ALUMNI_ROLES)[number]["value"];

export const ROLE_LABEL: Record<AlumniRoleValue, string> = {
  camper: "Camper",
  staff: "Staff",
  board: "Board",
};
