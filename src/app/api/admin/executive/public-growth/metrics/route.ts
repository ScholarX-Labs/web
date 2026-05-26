import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/admin/rate-limiter";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import {
  publicImpactProposalSchema,
} from "@/domain/executive/contracts/executive-query.schemas";
import { createPublicImpactGovernanceService } from "@/domain/executive/application/public-impact-governance.service";
import { createPublicImpactGovernanceRepository } from "@/domain/executive/infrastructure/db/executive.repository";

export const dynamic = "force-dynamic";

function jsonError(code: string, message: string, status: number, data?: unknown) {
  return NextResponse.json(
    { status: "error", code, message, ...(data === undefined ? {} : { data }) },
    { status },
  );
}

async function resolveAdmin(request: NextRequest) {
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
    "/api/admin/executive/public-growth/metrics",
  );
  if (!rateLimit.allowed) {
    throw jsonError("RATE_LIMITED", "Too many requests", 429, {
      resetAt: rateLimit.resetAt,
      remaining: rateLimit.remaining,
    });
  }
  return { userId: session.user.id };
}

function service() {
  return createPublicImpactGovernanceService(createPublicImpactGovernanceRepository());
}

export async function GET(request: NextRequest) {
  try {
    await resolveAdmin(request);
    const data = await service().listMetrics();
    return NextResponse.json({ status: "success", data });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[api/admin/executive/public-growth/metrics] GET failed:", error);
    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await resolveAdmin(request);
    const parsed = publicImpactProposalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Validation failed", 422, {
        fieldErrors: parsed.error.issues,
      });
    }
    const data = await service().proposeMetric(admin.userId, parsed.data);
    return NextResponse.json({ status: "success", data });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    if (error instanceof SyntaxError) {
      return jsonError("VALIDATION_ERROR", "Invalid JSON body", 422);
    }
    if (error instanceof Error && error.message.startsWith("Invalid public impact transition")) {
      return jsonError("INVALID_TRANSITION", error.message, 409);
    }
    console.error("[api/admin/executive/public-growth/metrics] POST failed:", error);
    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
