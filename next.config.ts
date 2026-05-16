import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

const sentryVars = {
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
} as const;
const hasSentryConfig = Object.values(sentryVars).every(Boolean);

export default hasSentryConfig
  ? withSentryConfig(nextConfig, {
      org: sentryVars.SENTRY_ORG!,
      project: sentryVars.SENTRY_PROJECT!,
      authToken: sentryVars.SENTRY_AUTH_TOKEN!,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      silent: !process.env.CI,
    })
  : nextConfig;
