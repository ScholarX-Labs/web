import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { isNull, sql } from "drizzle-orm";
import { slugify, randomSuffix } from "@/lib/username-utils";

const BATCH_SIZE = 100;

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
        let base = slugify(`${u.firstName}.${u.lastName}`);
        if (!base) {
          base = `user-${randomSuffix()}`;
        }

        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`;

          if (!candidate) continue;

          try {
            const result = await db
              .update(user)
              .set({ username: candidate })
              .where(
                sql`${user.id} = ${u.id} AND ${user.username} IS NULL`
              );

            if (result.rowCount !== null && result.rowCount > 0) {
              return;
            }
          } catch (err: unknown) {
            const pgErr = err as { code?: string };
            if (pgErr.code === "23505") {
              continue;
            }
            throw err;
          }
        }

        // Fallback: unique username with null-guard to avoid overwriting concurrent writes
        const fallback = `user-${randomSuffix(12)}`;
        await db
          .update(user)
          .set({ username: fallback })
          .where(sql`${user.id} = ${u.id} AND ${user.username} IS NULL`);
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
