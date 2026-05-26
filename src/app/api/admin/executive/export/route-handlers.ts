import { NextRequest, NextResponse } from "next/server";
import { executiveExportRequestSchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { ExecutiveExportServicePort } from "@/domain/executive/contracts/export-renderer.contract";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";
import { ExecutiveError, isExecutiveError } from "@/domain/executive/application/executive-errors";

export type ExecutiveExportSession = {
  user?: {
    id?: string;
    role?: string | null;
  };
} | null;

export type ExecutiveExportRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type ExecutiveExportRouteDeps = {
  getFlags: () => ExecutiveFeatureFlags;
  getSession: (request: NextRequest) => Promise<ExecutiveExportSession>;
  checkRateLimit: (
    identifier: string,
    path: string,
  ) => Promise<ExecutiveExportRateLimitResult>;
  createService: () => ExecutiveExportServicePort;
};

function jsonError(code: string, message: string, status: number, data?: unknown): NextResponse {
  return NextResponse.json(
    { status: "error", code, message, ...(data === undefined ? {} : { data }) },
    { status },
  );
}

async function resolveAdmin(
  deps: ExecutiveExportRouteDeps,
  request: NextRequest,
) {
  const flags = deps.getFlags();
  if (!flags.EXECUTIVE_DASHBOARD_ENABLED) {
    throw jsonError("NOT_FOUND", "Route not found", 404);
  }

  const session = await deps.getSession(request);
  if (!session?.user?.id) {
    throw jsonError("ADMIN_SESSION_EXPIRED", "Authentication required", 401);
  }
  if (session.user.role !== "admin") {
    throw jsonError("ADMIN_UNAUTHORIZED", "Admin role required", 403);
  }

  const rateLimit = await deps.checkRateLimit(session.user.id, "/api/admin/executive/export");
  if (!rateLimit.allowed) {
    throw jsonError("RATE_LIMITED", "Too many requests", 429, {
      resetAt: rateLimit.resetAt,
      remaining: rateLimit.remaining,
    });
  }

  return {
    userId: session.user.id,
    role: "admin" as const,
  };
}

export function createExecutiveExportRouteHandlers(deps: ExecutiveExportRouteDeps) {
  const POST = async (request: NextRequest) => {
    try {
      const actor = await resolveAdmin(deps, request);
      const parsed = executiveExportRequestSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonError("VALIDATION_ERROR", "Validation failed", 422, {
          fieldErrors: parsed.error.issues,
        });
      }

      const result = await deps.createService().generate(
        {
          userId: actor.userId,
          role: actor.role,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
        parsed.data,
      );

      return new NextResponse(result.body, {
        status: 200,
        headers: {
          "content-type": `${result.contentType}; charset=utf-8`,
          "content-disposition": `attachment; filename="${result.fileName}"`,
          "x-executive-export-id": result.exportId,
          "x-executive-audit-id": result.auditId,
          "x-executive-generated-at": result.generatedAt,
          "x-executive-redaction-notes": encodeURIComponent(JSON.stringify(result.redactionNotes)),
        },
      });
    } catch (error) {
      if (error instanceof NextResponse) return error;
      if (error instanceof SyntaxError) {
        return jsonError("VALIDATION_ERROR", "Invalid JSON body", 422);
      }
      if (isExecutiveError(error)) {
        return jsonError(error.code, error.message, error.statusCode, error.details);
      }
      if (error instanceof ExecutiveError) {
        return jsonError(error.code, error.message, error.statusCode, error.details);
      }
      console.error("[api/admin/executive/export] POST failed:", error);
      return jsonError("INTERNAL_ERROR", "Internal server error", 500);
    }
  };

  return { POST };
}
