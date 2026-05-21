import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNextCourseDomain, isNextCourseError } from "@/domain/courses";

type ErrorEnvelope = {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

const submitRateWindowMs = 10 * 60 * 1000;
const submitRateLimit = 5;
const submitRateState = new Map<string, number[]>();

const getRequestId = (request: NextRequest) =>
  request.headers.get("x-request-id") ?? crypto.randomUUID();

const cleanupTimestamps = (timestamps: number[], now: number) =>
  timestamps.filter((timestamp) => now - timestamp < submitRateWindowMs);

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
  const now = Date.now();
  const abuseKey = getAbuseKey(request);
  const key = `${userId}:${courseId}:${abuseKey}`;
  const timestamps = cleanupTimestamps(submitRateState.get(key) ?? [], now);

  if (timestamps.length >= submitRateLimit) {
    const retryAfterMs = submitRateWindowMs - (now - timestamps[0]);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return createErrorResponse(
      requestId,
      429,
      "RATE_LIMITED",
      "Too many application attempts. Please wait before trying again.",
      undefined,
      {
        "Retry-After": String(retryAfterSeconds),
      },
    );
  }

  timestamps.push(now);
  submitRateState.set(key, timestamps);
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
