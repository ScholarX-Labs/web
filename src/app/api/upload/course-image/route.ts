import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dbCourses } from "@/db/schema/courses-db.schema";
import { auth } from "@/lib/auth";
import { uploadCourseImage, deleteCourseImage, UploadError } from "@/lib/upload";
import { isCourseImageUploadEnabled } from "@/lib/app-config";
import { peekCourseImageUploadLimit, consumeCourseImageUploadSlot } from "@/lib/rate-limiter";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enabled = await isCourseImageUploadEnabled();
    if (!enabled) {
      return NextResponse.json(
        { success: false, error: "Course image uploads are currently disabled" },
        { status: 503 }
      );
    }

    // Peek: check budget without spending a slot
    const budgetCheck = await peekCourseImageUploadLimit(session.user.id);
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
    const courseId = formData.get("courseId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!courseId || typeof courseId !== "string") {
        return NextResponse.json(
          { success: false, error: "No courseId provided" },
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
        { success: false, error: "File exceeds 5MB limit" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const [currentCourse] = await db
        .select({ imageUrl: dbCourses.imageUrl })
        .from(dbCourses)
        .where(eq(dbCourses.id, courseId))
        .limit(1);

    if (!currentCourse) {
        return NextResponse.json(
            { success: false, error: "Course not found" },
            { status: 404 }
          );
    }

    let url: string;
    try {
      url = await uploadCourseImage(courseId, buffer, file.type);
    } catch (error) {
      if (error instanceof UploadError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }

    if (currentCourse.imageUrl) {
      await deleteCourseImage(currentCourse.imageUrl);
    }

    await db
      .update(dbCourses)
      .set({ imageUrl: url })
      .where(eq(dbCourses.id, courseId));

    // Consume a slot AFTER the upload succeeds
    await consumeCourseImageUploadSlot(session.user.id);

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("[upload/course-image] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
