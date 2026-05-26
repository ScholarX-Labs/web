import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/admin/rate-limiter";
import { createExecutiveDomain } from "@/domain/executive";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import { createExecutiveExportService } from "@/domain/executive/application/executive-export.service";
import { renderExecutiveCsv } from "@/lib/executive/csv-export";
import { renderExecutiveSnapshot } from "@/lib/executive/snapshot-export";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema/admin-db.schema";
import { createExecutiveExportRouteHandlers } from "./route-handlers";

export const dynamic = "force-dynamic";

const handlers = createExecutiveExportRouteHandlers({
  getFlags: getExecutiveFlags,
  getSession: (request: NextRequest) => auth.api.getSession({ headers: request.headers }),
  checkRateLimit,
  createService: () =>
    createExecutiveExportService({
      domain: createExecutiveDomain(),
      renderer: {
        renderCsv: renderExecutiveCsv,
        renderSnapshot: renderExecutiveSnapshot,
      },
      writeAudit: async ({ actor, exportId, payload }) => {
        const rows = await db.insert(adminAuditLog).values({
          adminId: actor.userId,
          action: "executive.export.generated",
          entityType: "executive_export",
          entityId: exportId,
          before: null,
          after: {
            pageId: payload.pageId,
            format: payload.format,
            query: payload.query,
            sectionIds: payload.sectionIds ?? [],
            redactionNotes: payload.redactionNotes,
          },
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
        }).returning({ id: adminAuditLog.id });

        return rows[0]?.id ?? exportId;
      },
    }),
});

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
