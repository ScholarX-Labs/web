import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const phone = (url.searchParams.get("phone") ?? "").trim();
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const errors: { email?: string; phone?: string } = {};

  if (!phone && !email) {
    return NextResponse.json(
      { errors: { form: "email or phone is required" } },
      { status: 400 },
    );
  }

  const [foundEmail, foundPhone] = await Promise.all([
    email
      ? db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email))
          .limit(1)
      : Promise.resolve([]),
    phone
      ? db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.phoneNumber, phone))
          .limit(1)
      : Promise.resolve([]),
  ]);

  if (foundEmail.length > 0) {
    errors.email = "Email already exists";
  }

  if (foundPhone.length > 0) {
    errors.phone = "Phone number already exists";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
