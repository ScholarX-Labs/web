import type { Metadata } from "next";

import SentryTestClient from "./_components/sentry-test-client";
import { requireRole } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Sentry Test",
  description: "A simple page for verifying Sentry error capture end to end.",
};

type SentryTestPageProps = {
  searchParams?: {
    server?: string;
  };
};

export default async function SentryTestPage({
  searchParams,
}: SentryTestPageProps) {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // In production require admin role
    await requireRole("admin");
  }

  if (searchParams?.server === "1") {
    throw new Error("Sentry test server error");
  }

  return <SentryTestClient />;
}
