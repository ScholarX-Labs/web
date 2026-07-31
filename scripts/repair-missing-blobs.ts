/**
 * One-time certificate artifact repair script.
 *
 * Finds all artifacts that are:
 *   (a) status = 'ready' but the blob doesn't exist in Azure Storage, OR
 *   (b) status = 'generating' stuck for more than 10 minutes (zombie workers)
 *
 * Resets them to 'pending' and creates fresh outbox rows so the worker picks them up.
 *
 * Run:
 *   node --import tsx scripts/repair-missing-blobs.ts
 */

import "dotenv/config";
import { eq, and, lt, or } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCertificateArtifacts,
  dbCanonicalCertificates,
  dbCertificateArtifactQueue,
} from "@/db/schema/certificates-db.schema";
import { randomUUID } from "crypto";

async function main() {
  console.log("[RepairScript] Starting missing blob repair...");

  // Load Azure storage adapter
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    console.error("AZURE_STORAGE_CONNECTION_STRING is not set");
    process.exit(1);
  }
  const blobService = BlobServiceClient.fromConnectionString(connectionString);

  // Find all 'ready' and stuck 'generating' artifacts
  const artifacts = await db
    .select({
      id: dbCertificateArtifacts.id,
      certificateId: dbCertificateArtifacts.certificateId,
      status: dbCertificateArtifacts.status,
      storageKey: dbCertificateArtifacts.storageKey,
      storageContainer: dbCertificateArtifacts.storageContainer,
      artifactType: dbCertificateArtifacts.artifactType,
      templateVersion: dbCertificateArtifacts.templateVersion,
      certificateNumber: dbCanonicalCertificates.certificateNumber,
    })
    .from(dbCertificateArtifacts)
    .innerJoin(
      dbCanonicalCertificates,
      eq(dbCertificateArtifacts.certificateId, dbCanonicalCertificates.id),
    )
    .where(
      or(
        eq(dbCertificateArtifacts.status, "ready"),
        and(
          eq(dbCertificateArtifacts.status, "generating"),
          lt(
            dbCertificateArtifacts.updatedAt,
            new Date(Date.now() - 10 * 60 * 1000),
          ),
        ),
      ),
    );

  console.log(`[RepairScript] Found ${artifacts.length} artifacts to check`);

  let resetCount = 0;
  let okCount = 0;

  for (const artifact of artifacts) {
    const container = artifact.storageContainer ?? "certificates";
    const key = artifact.storageKey;

    // If no storage key, the blob was never recorded — reset immediately
    if (!key) {
      console.log(`[RepairScript] Artifact ${artifact.id} (${artifact.certificateNumber}) has no storageKey — resetting`);
      await resetArtifact(artifact.id, artifact.certificateId, artifact.artifactType, artifact.templateVersion);
      resetCount++;
      continue;
    }

    // Check whether the blob actually exists in Azure
    const containerClient = blobService.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(key);

    try {
      const exists = await blobClient.exists();
      if (!exists) {
        console.log(`[RepairScript] Blob missing for artifact ${artifact.id} (${artifact.certificateNumber}) — resetting`);
        await resetArtifact(artifact.id, artifact.certificateId, artifact.artifactType, artifact.templateVersion);
        resetCount++;
      } else {
        console.log(`[RepairScript] Artifact ${artifact.id} (${artifact.certificateNumber}) OK — blob exists`);
        okCount++;
      }
    } catch (err) {
      console.error(`[RepairScript] Failed to check blob for artifact ${artifact.id}:`, err);
    }
  }

  console.log(`[RepairScript] Done. Reset ${resetCount} artifacts, ${okCount} were already OK.`);
  process.exit(0);
}

async function resetArtifact(
  artifactId: string,
  certificateId: string,
  artifactType: string,
  templateVersion: string,
) {
  // Reset the artifact back to pending
  await db
    .update(dbCertificateArtifacts)
    .set({
      status: "pending",
      storageKey: null,
      storageContainer: null,
      contentType: null,
      byteSize: null,
      checksumSha256: null,
      generatedAt: null,
      errorCode: "BLOB_MISSING_REPAIR",
      errorMessage: "Blob not found in storage; reset for regeneration",
      attempts: 0,
      nextAttemptAt: null,
      updatedAt: new Date(),
    })
    .where(eq(dbCertificateArtifacts.id, artifactId));

  // Create a fresh outbox row so the repair job publishes it to Service Bus
  const messageId = `${artifactId}:${artifactType}:${templateVersion}:blob-repair-${Date.now()}-${randomUUID()}`;
  await db
    .insert(dbCertificateArtifactQueue)
    .values({
      artifactId,
      certificateId,
      messageId,
      queueName: "certificate-artifact-generation",
      status: "pending",
      attempts: 0,
    })
    .onConflictDoNothing();

  console.log(`[RepairScript] Reset artifact ${artifactId}, created outbox row`);
}

main().catch((err) => {
  console.error("[RepairScript] Fatal error:", err);
  process.exit(1);
});
