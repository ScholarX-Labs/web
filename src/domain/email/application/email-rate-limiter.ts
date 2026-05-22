import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbEmailRateLimitCounters } from "@/db/schema/email-db.schema";
import type { EmailRateLimiter } from "../contracts/email-infrastructure";
import type { EmailRateLimitScope, EmailServiceConfig } from "../contracts/email-types";
import { hashEmailValue } from "./email-sanitization";

export class DbEmailRateLimiter implements EmailRateLimiter {
  constructor(private readonly config: EmailServiceConfig["rateLimits"]) {}

  async checkAndIncrement(input: Parameters<EmailRateLimiter["checkAndIncrement"]>[0]) {
    const checks = [
      {
        scope: "recipient" as const,
        key: input.recipientEmail,
        windowSeconds: 60 * 60,
        limit: this.config.perRecipientPerHour,
      },
      {
        scope: "category" as const,
        key: input.category,
        windowSeconds: 60,
        limit: this.config.perCategoryPerMinute,
      },
      {
        scope: "caller" as const,
        key: input.callerKey,
        windowSeconds: 60,
        limit: this.config.perCallerPerMinute,
      },
    ];

    for (const check of checks) {
      const count = await this.increment({
        scope: check.scope,
        key: check.key,
        windowSeconds: check.windowSeconds,
        now: input.now,
      });

      if (count > check.limit) {
        return {
          allowed: false as const,
          retryAfter: new Date(
            bucketStart(input.now, check.windowSeconds).getTime() +
              check.windowSeconds * 1000,
          ),
          scope: check.scope,
        };
      }
    }

    return { allowed: true as const };
  }

  private async increment(input: {
    scope: EmailRateLimitScope;
    key: string;
    windowSeconds: number;
    now: Date;
  }): Promise<number> {
    const windowStart = bucketStart(input.now, input.windowSeconds);
    const scopeKeyHash = hashEmailValue(`${input.scope}:${input.key}`);
    const expiresAt = new Date(windowStart.getTime() + input.windowSeconds * 2000);

    await db
      .insert(dbEmailRateLimitCounters)
      .values({
        scope: input.scope,
        scopeKeyHash,
        windowStart,
        windowSeconds: input.windowSeconds,
        count: 1,
        expiresAt,
        updatedAt: input.now,
      })
      .onConflictDoUpdate({
        target: [
          dbEmailRateLimitCounters.scope,
          dbEmailRateLimitCounters.scopeKeyHash,
          dbEmailRateLimitCounters.windowStart,
          dbEmailRateLimitCounters.windowSeconds,
        ],
        set: {
          count: sql`${dbEmailRateLimitCounters.count} + 1`,
          updatedAt: input.now,
        },
      });

    const [row] = await db
      .select({ count: dbEmailRateLimitCounters.count })
      .from(dbEmailRateLimitCounters)
      .where(
        and(
          eq(dbEmailRateLimitCounters.scope, input.scope),
          eq(dbEmailRateLimitCounters.scopeKeyHash, scopeKeyHash),
          eq(dbEmailRateLimitCounters.windowStart, windowStart),
          eq(dbEmailRateLimitCounters.windowSeconds, input.windowSeconds),
        ),
      );

    return row?.count ?? 1;
  }
}

function bucketStart(now: Date, windowSeconds: number): Date {
  const bucketMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / bucketMs) * bucketMs);
}
