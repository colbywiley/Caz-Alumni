import { z } from "zod";
import { INSTRUMENTS, STAFF_POSITIONS } from "@/lib/constants/picklists";

const currentYear = new Date().getFullYear();
const yearSchema = z
  .number()
  .int()
  .min(1957, "Year must be 1957 or later")
  .max(currentYear + 1, `Year cannot be after ${currentYear + 1}`);

export const roleSchema = z
  .object({
    role: z.enum(["camper", "staff", "board"]),
    start_year: yearSchema.nullable(),
    end_year: yearSchema.nullable(),
    positions: z.array(z.enum(STAFF_POSITIONS as readonly [string, ...string[]])).default([]),
    other_position: z.string().max(120).nullable().default(null),
  })
  .superRefine((val, ctx) => {
    if (val.start_year != null && val.end_year != null && val.end_year < val.start_year) {
      ctx.addIssue({ code: "custom", path: ["end_year"], message: "End year must be after start year" });
    }
    if (val.role !== "staff" && val.positions.length > 0) {
      ctx.addIssue({ code: "custom", path: ["positions"], message: "Positions only apply to Staff" });
    }
    if (val.positions.includes("Other")) {
      const txt = (val.other_position ?? "").trim();
      if (!txt) {
        ctx.addIssue({
          code: "custom",
          path: ["other_position"],
          message: 'Please describe the position when "Other" is selected',
        });
      }
    }
  });

export type RoleInput = z.infer<typeof roleSchema>;

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(120),
  display_name: z.string().max(120).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  instruments: z.array(z.enum(INSTRUMENTS as readonly [string, ...string[]])).default([]),
  show_in_directory: z.boolean(),
  share_email_in_directory: z.boolean(),
  roles: z.array(roleSchema).max(3),
});

export type ProfileInput = z.infer<typeof profileSchema>;
