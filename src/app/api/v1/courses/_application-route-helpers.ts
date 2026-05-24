import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNextCourseDomain, isNextCourseError } from "@/domain/courses";
import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

type ErrorEnvelope = {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

const submitRateWindowSeconds = 10 * 60;
const submitRateLimit = 5;

const getRequestId = (request: NextRequest) =>
  request.headers.get("x-request-id") ?? crypto.randomUUID();

const getAbuseKey = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
  return createHash("sha256").update(forwardedFor).digest("hex").slice(0, 16);
};

export const getAuthenticatedUserId = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return userId;
};

export const createSuccessResponse = <T>(
  requestId: string,
  data: T,
  init?: ResponseInit,
) => NextResponse.json({ success: true, requestId, data }, init);

export const createErrorResponse = (
  requestId: string,
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
  headers?: HeadersInit,
) =>
  NextResponse.json<ErrorEnvelope>(
    {
      success: false,
      requestId,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    { status, headers },
  );

export const enforceApplicationSubmitRateLimit = async (
  request: NextRequest,
  userId: string,
  courseId: string,
  requestId: string,
) => {
  const abuseKey = getAbuseKey(request);
  const result = await checkDistributedRateLimit(
    {
      id: "course.application.user-resource.10m",
      windowSeconds: submitRateWindowSeconds,
      maxRequests: submitRateLimit,
      failureMode: "fail-closed",
    },
    buildRateLimitSubject(["course-application", userId, courseId, abuseKey]),
  );

  if (!result.allowed) {
    return createErrorResponse(
      requestId,
      429,
      "RATE_LIMITED",
      "Too many application attempts. Please wait before trying again.",
      undefined,
      {
        "Retry-After": String(result.retryAfterSeconds),
      },
    );
  }
  return null;
};

export const withCourseApplicationErrorHandling = (
  request: NextRequest,
  error: unknown,
) => {
  const requestId = getRequestId(request);

  if (isNextCourseError(error)) {
    return createErrorResponse(
      requestId,
      error.statusCode,
      error.code,
      error.message,
      (error.details as { fieldErrors?: Record<string, string[] | undefined> } | null)
        ?.fieldErrors,
    );
  }

  console.error("[api/v1/courses/application] unexpected error", error);
  return createErrorResponse(
    requestId,
    500,
    "INTERNAL_SERVER_ERROR",
    "Internal server error",
  );
};

export const getCourseDomain = () => createNextCourseDomain();
export const getApplicationRequestId = getRequestId;
