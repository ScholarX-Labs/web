import { z } from "zod";

/**
 * Zod validation schema for GET /api/bunny/token query parameters.
 *
 * @see specs/018-bunny-net-video-migration/contracts/cdn-token-api.md
 */

function sanitizeBunnyUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete("token");
    url.searchParams.delete("expires");
    url.searchParams.delete("token_path");
    url.searchParams.delete("bcdn_token");
    url.pathname = url.pathname.replace(/^\/bcdn_token=[^/]+\//, "/");
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function safeGetUrlHost(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return "";
  }
}

function safeGetUrlPathname(urlStr: string): string {
  try {
    return new URL(urlStr).pathname;
  } catch {
    return urlStr;
  }
}

export const BunnyTokenRequestSchema = z.object({
  videoUrl: z
    .string()
    .min(1, "Missing required parameter: videoUrl")
    .transform(sanitizeBunnyUrl)
    .pipe(
      z
        .string()
        .url("videoUrl must be a valid URL")
        .refine(
          (url) => /b-cdn\.net/i.test(safeGetUrlHost(url)),
          "videoUrl must be a Bunny CDN URL (b-cdn.net hostname)",
        )
        .refine(
          (url) =>
            /\.m3u8$/i.test(safeGetUrlPathname(url)) ||
            /\.mp4$/i.test(safeGetUrlPathname(url)),
          "videoUrl must have .m3u8 or .mp4 extension",
        ),
    ),

  expires: z
    .number()
    .int("expires must be an integer")
    .min(0, "expires must be a positive timestamp")
    .optional(),
});

export type BunnyTokenRequestInput = z.infer<typeof BunnyTokenRequestSchema>;
