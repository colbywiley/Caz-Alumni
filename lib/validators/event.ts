import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(8000).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    start_at: z.string().min(1, "Start date/time is required"),
    end_at: z.string().nullable().optional(),
    external_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
    cover_image_url: z.string().url().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.end_at && new Date(val.end_at) < new Date(val.start_at)) {
      ctx.addIssue({ code: "custom", path: ["end_at"], message: "End must be after start" });
    }
  });

export type EventInput = z.infer<typeof eventSchema>;
