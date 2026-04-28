export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CompletionCriteriaRepository } from "@/domain/certificates/infrastructure/db/completion-criteria.repository";
import { db } from "@/db";
import { z } from "zod";

const CriteriaSchema = z
  .object({
    courseId: z.string().min(1),
    minWatchPercentage: z.number().int().min(0).max(100),
    quizzesRequired: z.boolean(),
    minQuizScore: z.number().int().min(0).max(100).nullable(),
  })
  .refine(
    (d) => !d.quizzesRequired || d.minQuizScore !== null,
    { message: "minQuizScore is required when quizzesRequired is true" },
  );

/**
 * GET /api/certificates/criteria?courseId=<id>
 * Admin-only: fetch completion criteria for a course.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId query param is required" }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CompletionCriteriaRepository(db as any);
  const criteria = await repo.findByCourseId(courseId);

  if (!criteria) {
    return NextResponse.json({ error: "No criteria configured for this course" }, { status: 404 });
  }

  return NextResponse.json(criteria);
}

/**
 * PUT /api/certificates/criteria
 * Admin-only: create or update completion criteria for a course.
 */
export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CriteriaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CompletionCriteriaRepository(db as any);
  const criteria = await repo.upsert(parsed.data);

  return NextResponse.json(criteria, { status: 200 });
}
