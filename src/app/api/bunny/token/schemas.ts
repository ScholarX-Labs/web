import { z } from "zod";

/**
 * Zod validation schema for GET /api/bunny/token query parameters.
 *
 * @see specs/018-bunny-net-video-migration/contracts/cdn-token-api.md
 */

export const BunnyTokenRequestSchema = z.object({
  videoUrl: z
    .string()
    .min(1, "Missing required parameter: videoUrl")
    .url("videoUrl must be a valid URL")
    .refine(
      (url) => /b-cdn\.net/i.test(url),
      "videoUrl must be a Bunny CDN URL (b-cdn.net hostname)",
    )
    .refine(
      (url) => /\.m3u8$/i.test(url) || /\.mp4$/i.test(url),
      "videoUrl must have .m3u8 or .mp4 extension",
    )
    .refine(
      (url) => !url.includes("bcdn_token="),
      "videoUrl must not already contain a token parameter",
    ),

  expires: z
    .number()
    .int("expires must be an integer")
    .min(0, "expires must be a positive timestamp")
    .optional(),
});

export type BunnyTokenRequestInput = z.infer<typeof BunnyTokenRequestSchema>;
