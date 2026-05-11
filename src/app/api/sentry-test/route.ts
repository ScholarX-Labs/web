import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  Sentry.captureException(new Error("[Sentry Test] Server-side API route error"));

  try {
    throw new Error("[Sentry Test] Server-side unhandled error");
  } catch (e) {
    Sentry.captureException(e);
  }

  return new NextResponse(
    `Server error sent to Sentry. Check your Sentry dashboard.\nTimestamp: ${new Date().toISOString()}`,
  );
}
