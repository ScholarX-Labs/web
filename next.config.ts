import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    // TTL of 0 forces the Next.js Image Optimization cache to revalidate
    // on every deployment / on-demand revalidation. Vercel's CDN still
    // applies edge-level caching for performance, but the optimised disk
    // entry is never stale after an admin image update.
    minimumCacheTTL: 0,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "xubohuah.github.io",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Vercel Blob Storage (current provider)
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      // Azure Blob Storage (legacy / future fallback)
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!posthogHost) {
      return [];
    }
    return [
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/messages.ts");

const sentryVars = {
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
} as const;
const hasSentryConfig = Object.values(sentryVars).every(Boolean);

const sentryBuildOptions = hasSentryConfig
  ? {
      org: sentryVars.SENTRY_ORG!,
      project: sentryVars.SENTRY_PROJECT!,
      authToken: sentryVars.SENTRY_AUTH_TOKEN!,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      silent: !process.env.CI,
    }
  : {
      // Source map upload is disabled (build-time vars not set),
      // but runtime instrumentation (Session Replay, tracing, etc.) still works.
      silent: true,
    };

export default withSentryConfig(withNextIntl(nextConfig), sentryBuildOptions);
