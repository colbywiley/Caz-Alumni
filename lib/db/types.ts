// Hand-curated DB types. Replace with `supabase gen types typescript` output once
// you wire up the CLI; this is sufficient for the app's current usage.

export type AlumniRoleEnum = "camper" | "staff" | "board";
export type RsvpStatus = "going" | "not_going";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
  instruments: string[];
  show_in_directory: boolean;
  share_email_in_directory: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlumniRoleRow {
  id: string;
  profile_id: string;
  role: AlumniRoleEnum;
  start_year: number | null;
  end_year: number | null;
  positions: string[];
  other_position: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  external_url: string | null;
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRsvpRow {
  event_id: string;
  profile_id: string;
  status: RsvpStatus;
  created_at: string;
}

type TableShape<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      alumni_roles: TableShape<AlumniRoleRow>;
      events: TableShape<EventRow>;
      event_rsvps: TableShape<EventRsvpRow>;
      allowed_instruments: TableShape<{ name: string }>;
      allowed_staff_positions: TableShape<{ name: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      alumni_role: AlumniRoleEnum;
      rsvp_status: RsvpStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
