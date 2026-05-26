import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/admin/rate-limiter";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import { publicImpactReviewSchema } from "@/domain/executive/contracts/executive-query.schemas";
import { createPublicImpactGovernanceService } from "@/domain/executive/application/public-impact-governance.service";
import { createPublicImpactGovernanceRepository } from "@/domain/executive/infrastructure/db/executive.repository";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonError(code: string, message: string, status: number, data?: unknown) {
  return NextResponse.json(
    { status: "error", code, message, ...(data === undefined ? {} : { data }) },
    { status },
  );
}

async function resolveAdmin(request: NextRequest, metricId: string) {
  const flags = getExecutiveFlags();
  if (!flags.EXECUTIVE_DASHBOARD_ENABLED || !flags.PUBLIC_IMPACT_GOVERNANCE_ENABLED) {
    throw jsonError("NOT_FOUND", "Route not found", 404);
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    throw jsonError("ADMIN_SESSION_EXPIRED", "Authentication required", 401);
  }
  if (session.user.role !== "admin") {
    throw jsonError("ADMIN_UNAUTHORIZED", "Admin role required", 403);
  }
  const rateLimit = await checkRateLimit(
    session.user.id,
    `/api/admin/executive/public-growth/metrics/${metricId}`,
  );
  if (!rateLimit.allowed) {
    throw jsonError("RATE_LIMITED", "Too many requests", 429, {
      resetAt: rateLimit.resetAt,
      remaining: rateLimit.remaining,
    });
  }
  return { userId: session.user.id };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await resolveAdmin(request, id);
    const parsed = publicImpactReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Validation failed", 422, {
        fieldErrors: parsed.error.issues,
      });
    }

    const data = await createPublicImpactGovernanceService(
      createPublicImpactGovernanceRepository(),
    ).reviewMetric(admin.userId, id, parsed.data);
    return NextResponse.json({ status: "success", data });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (error instanceof SyntaxError) {
      return jsonError("VALIDATION_ERROR", "Invalid JSON body", 422);
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return jsonError("NOT_FOUND", error.message, 404);
    }
    if (error instanceof Error && error.message.includes("cannot approve")) {
      return jsonError("APPROVAL_CONFLICT", error.message, 409);
    }
    if (error instanceof Error && (error.message.startsWith("Invalid public impact transition") || error.message.includes("requires a reason"))) {
      return jsonError("INVALID_TRANSITION", error.message, 409);
    }
    console.error("[api/admin/executive/public-growth/metrics/:id] PATCH failed:", error);
    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
