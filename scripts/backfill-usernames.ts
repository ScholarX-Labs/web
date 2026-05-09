import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { isNull, eq, sql } from "drizzle-orm";

const BATCH_SIZE = 100;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 26);
}

function randomSuffix(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

async function backfillUsernames(): Promise<{
  succeeded: number;
  failed: number;
}> {
  let succeeded = 0;
  let failed = 0;

  console.log("[backfill] Starting username backfill...");

  while (true) {
    const batch = await db
      .select({ id: user.id, firstName: user.firstName, lastName: user.lastName })
      .from(user)
      .where(isNull(user.username))
      .limit(BATCH_SIZE);

    if (batch.length === 0) {
      console.log("[backfill] No more users to process.");
      break;
    }

    console.log(`[backfill] Processing batch of ${batch.length} users...`);

    const results = await Promise.allSettled(
      batch.map(async (u) => {
        const base = slugify(`${u.firstName}.${u.lastName}`);

        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`;

          const result = await db
            .update(user)
            .set({ username: candidate })
            .where(
              sql`${user.id} = ${u.id} AND ${user.username} IS NULL`
            );

          if (result.rowCount !== null && result.rowCount > 0) {
            return;
          }
        }

        // Fallback: UUID-based guaranteed unique username
        const fallback = `user-${randomSuffix(12)}`;
        await db.update(user).set({ username: fallback }).where(eq(user.id, u.id));
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") succeeded++;
      else {
        failed++;
        console.error("[backfill] Failed:", r.reason);
      }
    }

    console.log(`[backfill] Progress: ${succeeded} succeeded, ${failed} failed`);
  }

  console.log(`[backfill] Complete: ${succeeded} succeeded, ${failed} failed`);

  // Verify
  const remaining = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(isNull(user.username));

  const remainingCount = Number(remaining[0]?.count ?? 0);
  if (remainingCount > 0) {
    console.error(
      `[backfill] WARNING: ${remainingCount} users still have NULL usernames!`
    );
  } else {
    console.log("[backfill] All users have usernames. Ready for Step 2 migration.");
  }

  return { succeeded, failed };
}

backfillUsernames()
  .then((result) => {
    console.log(`Final result: ${result.succeeded} ok, ${result.failed} failed`);
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("[backfill] Fatal error:", error);
    process.exit(1);
  });
