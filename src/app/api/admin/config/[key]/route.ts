import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getConfig, setConfig, clearConfigCache } from "@/lib/app-config";

const putSchema = z.object({
  value: z.string().min(1),
});

interface Props {
  params: Promise<{ key: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key } = await params;
    const value = await getConfig(key);

    return NextResponse.json({ key, value });
  } catch (error) {
    console.error("[admin/config] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key } = await params;
    const body = await request.json();
    const parsed = putSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid value", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    await setConfig(key, parsed.data.value, session.user.id);
    await clearConfigCache(key);

    const updatedValue = await getConfig(key);

    return NextResponse.json({
      success: true,
      key,
      value: updatedValue,
      updatedBy: session.user.id,
    });
  } catch (error) {
    console.error("[admin/config] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
