import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/config/env";
import { BunnyCdnTokenSigner } from "@/lib/bunny/token-signer";
import { BunnyTokenRequestSchema } from "./schemas";
import {
  checkDistributedRateLimit,
} from "@/lib/rate-limit/rate-limit.factory";
import type { DistributedRateLimitRule } from "@/lib/rate-limit/distributed-rate-limiter.port";

export const dynamic = "force-dynamic";

// ── Rate Limit Rule ──────────────────────────────────────────────────────────

const TOKEN_RATE_LIMIT_RULE: DistributedRateLimitRule = {
  id: "bunny-token",
  windowSeconds: 60,
  maxRequests: 5,
  failureMode: "fail-open",
};

// ── Error Response Helper ────────────────────────────────────────────────────

function errorResponse(
  code: string,
  numericCode: number,
  statusCode: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, numericCode, statusCode, message, ...extra },
    },
    { status: statusCode },
  );
}

// ── GET /api/bunny/token ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return errorResponse("UNAUTHORIZED", 9002, 401, "Authentication required");
    }

    // 2. Input Validation
    const { searchParams } = new URL(request.url);
    const videoUrlRaw = searchParams.get("videoUrl");
    const expiresRaw = searchParams.get("expires");

    const parsed = BunnyTokenRequestSchema.safeParse({
      videoUrl: videoUrlRaw,
      expires: expiresRaw ? Number(expiresRaw) : undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse(
        "BAD_REQUEST",
        9005,
        400,
        firstIssue?.message ?? "Invalid request parameters",
      );
    }

    const { videoUrl, expires } = parsed.data;

    // 3. Expiry validation (separate from Zod for clearer error messages)
    const nowSec = Math.floor(Date.now() / 1000);
    if (expires !== undefined) {
      if (expires < nowSec) {
        return errorResponse("BAD_REQUEST", 9005, 400, "expires must be a future timestamp");
      }
      if (expires > nowSec + 86400) {
        return errorResponse("BAD_REQUEST", 9005, 400, "expires must be within 24 hours");
      }
    }

    // 4. Rate Limiting
    const rateLimitDecision = await checkDistributedRateLimit(
      TOKEN_RATE_LIMIT_RULE,
      `${userId}:token-request`,
    );

    if (!rateLimitDecision.allowed) {
      const retryAfter = "retryAfterSeconds" in rateLimitDecision
        ? rateLimitDecision.retryAfterSeconds
        : 60;

      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        9004,
        429,
        "Too many requests. Please try again later.",
        { retryAfter },
      );
    }

    // 5. Token Signing
    const securityKey = env.BUNNY_VIDEO_LIBRARY_API_KEY;
    if (!securityKey) {
      console.error("[BUNNY] BUNNY_VIDEO_LIBRARY_API_KEY is not configured");
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        9999,
        500,
        "Video signing is not configured",
      );
    }

    const signer = new BunnyCdnTokenSigner({ securityKey });
    const signedResult = signer.signUrl(videoUrl, expires);

    // 6. Success Response
    return NextResponse.json({
      success: true,
      data: {
        token: signedResult.token,
        expires: signedResult.expires,
        signedUrl: signedResult.signedUrl,
      },
    });
  } catch (error) {
    console.error("[BUNNY] Unexpected error in token route:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      9999,
      500,
      "Internal server error",
    );
  }
}
