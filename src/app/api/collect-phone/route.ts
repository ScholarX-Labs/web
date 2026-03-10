import "server-only";

import * as schema from "@/db/schema/auth-schema";
import { db } from "@/db";
import { getSession } from "@/lib/dal";
import { and, eq, ne } from "drizzle-orm";

export async function POST(req: Request) {
  let phone: string;
  try {
    const body = await req.json();
    phone = (body.phone || "").toString().trim();
  } catch {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  if (!phone) {
    return Response.json({ error: "phone is required" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (session.user.phoneNumber) {
    console.warn(
      `[collect-phone] user ${session.user.id} already has a phone number`,
    );
    return Response.json(
      { error: "phone number already set" },
      { status: 409 },
    );
  }

  // check if another user already owns this phone number
  const existing = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(
      and(
        eq(schema.user.phoneNumber, phone),
        ne(schema.user.id, session.user.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    console.warn(`[collect-phone] phone already in use`);
    return Response.json(
      { error: "phone number already in use" },
      { status: 409 },
    );
  }

  try {
    await db
      .update(schema.user)
      .set({ phoneNumber: phone })
      .where(eq(schema.user.id, session.user.id));
  } catch (err: unknown) {
    // Race condition: unique constraint violation caught at DB level
    const isUniqueViolation =
      err instanceof Error &&
      ((err as any).code === "23505" ||
        err.message.includes("unique constraint"));

    if (isUniqueViolation) {
      console.warn(`[collect-phone] unique constraint race for phone`);
      return Response.json(
        { error: "phone number already in use" },
        { status: 409 },
      );
    }

    return Response.json({ error: "internal error" }, { status: 500 }); // 6. JSON error
  }

  return Response.json({ ok: true }, { status: 200 });
}
