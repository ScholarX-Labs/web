import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (session.user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  await db
    .update(user)
    .set({ emailVerificationSkipped: true })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ ok: true });
}
