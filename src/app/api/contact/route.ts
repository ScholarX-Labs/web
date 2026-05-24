import "server-only";

import { db } from "@/db";
import { contactUs } from "@/db/schema/contact-us-schema";
import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

import { contactSchema } from "@/app/contact/contact.schema";

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export async function POST(req: Request) {
  const forwardedFor =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rateLimit = await checkDistributedRateLimit(
    {
      id: "contact.submit.ip.hour",
      windowSeconds: 60 * 60,
      maxRequests: 5,
      failureMode: "fail-closed",
    },
    buildRateLimitSubject(["contact", forwardedFor]),
  );

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many contact requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_CONTACT_BODY_BYTES) {
    return Response.json({ error: "request body too large" }, { status: 413 });
  }

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid contact payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await db.insert(contactUs).values(parsed.data);
  } catch (error) {
    console.error("[contact] failed to save contact message", error);
    return Response.json({ error: "internal error" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
