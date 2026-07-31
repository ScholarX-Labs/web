/**
 * One-time cleanup script: remove all orphaned 'scholarx-v2' artifacts that
 * are in 'pending' or 'failed' status with no blob.
 *
 * These were created when CURRENT_TEMPLATE_VERSION was temporarily set to V2.
 * Now that we've reverted to V1, these rows are dead weight and should be removed
 * to prevent the repair job from endlessly re-queuing them.
 *
 * Run:
 *   doppler run -- node --import tsx scripts/cleanup-orphaned-v2-artifacts.ts
 */
import "dotenv/config";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCertificateArtifacts,
  dbCertificateArtifactQueue,
} from "@/db/schema/certificates-db.schema";

async function main() {
  console.log("[CleanupScript] Starting orphaned v2 artifact cleanup...");

  // Find all v2 pending/failed artifacts (no ready blob)
  const orphanedArtifacts = await db
    .select({ id: dbCertificateArtifacts.id })
    .from(dbCertificateArtifacts)
    .where(
      and(
        eq(dbCertificateArtifacts.templateVersion, "scholarx-v2"),
        ne(dbCertificateArtifacts.status, "ready"), // don't touch any that somehow got ready
      ),
    );

  if (!orphanedArtifacts.length) {
    console.log("[CleanupScript] No orphaned v2 artifacts found.");
    process.exit(0);
  }

  const artifactIds = orphanedArtifacts.map((a) => a.id);
  console.log(`[CleanupScript] Found ${artifactIds.length} orphaned v2 artifacts to clean up`);

  // Delete associated outbox rows first (FK constraint)
  const deletedOutbox = await db
    .delete(dbCertificateArtifactQueue)
    .where(inArray(dbCertificateArtifactQueue.artifactId, artifactIds))
    .returning({ id: dbCertificateArtifactQueue.id });

  console.log(`[CleanupScript] Deleted ${deletedOutbox.length} outbox rows`);

  // Delete the orphaned v2 artifact rows
  const deletedArtifacts = await db
    .delete(dbCertificateArtifacts)
    .where(inArray(dbCertificateArtifacts.id, artifactIds))
    .returning({ id: dbCertificateArtifacts.id });

  console.log(`[CleanupScript] Deleted ${deletedArtifacts.length} orphaned v2 artifact rows`);
  console.log("[CleanupScript] Done! The repair job will no longer re-queue these.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[CleanupScript] Fatal error:", err);
  process.exit(1);
});
