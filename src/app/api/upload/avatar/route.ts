import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";
import { uploadAvatar, deleteAvatar, UploadError } from "@/lib/upload";
import { isAvatarUploadEnabled } from "@/lib/app-config";
import { peekAvatarUploadLimit, consumeAvatarUploadSlot } from "@/lib/rate-limiter";
import { invalidatePublicProfileCache } from "@/actions/public-profile.actions";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enabled = await isAvatarUploadEnabled();
    if (!enabled) {
      return NextResponse.json(
        { success: false, error: "Avatar uploads are currently disabled" },
        { status: 503 }
      );
    }

    // Peek: check budget without spending a slot (failed uploads won't burn quota).
    const budgetCheck = await peekAvatarUploadLimit(session.user.id);
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload limit exceeded. Try again later.",
          remaining: budgetCheck.remaining,
          reset: budgetCheck.reset,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Accepted types: ${ACCEPTED_TYPES.join(", ")}`,
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 1MB limit" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    try {
      url = await uploadAvatar(session.user.id, buffer, file.type);
    } catch (error) {
      if (error instanceof UploadError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }

    const [current] = await db
      .select({ image: user.image, username: user.username })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (current?.image) {
      await deleteAvatar(current.image);
    }

    await db
      .update(user)
      .set({ image: url })
      .where(eq(user.id, session.user.id));

    await invalidatePublicProfileCache(current?.username);

    // Consume a slot AFTER the upload succeeds — failed attempts don't burn quota.
    await consumeAvatarUploadSlot(session.user.id);

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("[upload/avatar] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
