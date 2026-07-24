import { z } from "zod";

/**
 * Zod validation schema for GET /api/bunny/token query parameters.
 *
 * @see specs/018-bunny-net-video-migration/plan.md
 */
export const BunnyTokenRequestSchema = z.object({
  lessonId: z
    .string({ error: "lessonId is required" })
    .uuid("lessonId must be a valid UUID"),

  expires: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .refine(
      (v) => v === undefined || v > Math.floor(Date.now() / 1000) + 300,
      "expires must be at least 5 minutes in the future",
    )
    .refine(
      (v) => v === undefined || v < Math.floor(Date.now() / 1000) + 86400,
      "expires must be at most 24 hours in the future",
    ),
});

export type BunnyTokenRequestInput = z.infer<typeof BunnyTokenRequestSchema>;
