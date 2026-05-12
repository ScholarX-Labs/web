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

const requiredSentryVars = {
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
} as const;
for (const [key, value] of Object.entries(requiredSentryVars)) {
  if (!value) {
    throw new Error(
      `Missing required Sentry environment variable: ${key}. ` +
        "Ensure it is set before building.",
    );
  }
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG!,
  project: process.env.SENTRY_PROJECT!,
  authToken: process.env.SENTRY_AUTH_TOKEN!,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
