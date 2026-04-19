import "server-only";

import { db } from "@/db";
import { contactUs } from "@/db/schema/contact-us-schema";

import { contactSchema } from "@/app/contact/contact.schema";

export async function POST(req: Request) {
  let body: unknown;

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
