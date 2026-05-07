// Hand-curated DB types. Replace with `supabase gen types typescript` output once
// you wire up the CLI; this is sufficient for the app's current usage.

export type AlumniRoleEnum = "camper" | "staff" | "board";
export type RsvpStatus = "going" | "not_going";
export type NotificationType = "friend_added" | "photo_tag" | "post_tag";

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
  notify_on_friend_add: boolean;
  notify_on_photo_tag: boolean;
  notify_on_post_tag: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
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

export interface FriendshipRow {
  user_id: string;
  friend_id: string;
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
      friendships: TableShape<FriendshipRow>;
      notifications: TableShape<NotificationRow>;
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
