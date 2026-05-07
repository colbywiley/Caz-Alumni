import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address").max(254),
  note: z
    .string()
    .max(500, "Note must be 500 characters or fewer")
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

export type InviteInput = z.infer<typeof inviteSchema>;
