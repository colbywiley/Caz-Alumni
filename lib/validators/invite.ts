import { z } from "zod";

export const MAX_INVITES_PER_REQUEST = 20;

const emailRegex = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function parseEmailList(input: string): { valid: string[]; invalid: string[] } {
  const tokens = input
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    if (emailRegex.test(tok) && tok.length <= 254) valid.push(tok);
    else invalid.push(tok);
  }

  return { valid, invalid };
}

export const inviteSchema = z.object({
  emails: z
    .array(z.string().email().max(254))
    .min(1, "Please enter at least one email address")
    .max(MAX_INVITES_PER_REQUEST, `You can invite up to ${MAX_INVITES_PER_REQUEST} people at a time`),
  note: z
    .string()
    .max(500, "Note must be 500 characters or fewer")
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

export type InviteInput = z.infer<typeof inviteSchema>;
