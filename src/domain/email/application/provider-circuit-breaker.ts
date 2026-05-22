import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbEmailProviderCircuitStates } from "@/db/schema/email-db.schema";
import type { ProviderCircuitBreaker } from "../contracts/email-infrastructure";
import type { EmailFailureCategory, EmailProviderName, EmailServiceConfig } from "../contracts/email-types";

export class DbProviderCircuitBreaker implements ProviderCircuitBreaker {
  constructor(private readonly config: EmailServiceConfig["circuitBreaker"]) {}

  async beforeAttempt(provider: EmailProviderName, now: Date) {
    const state = await this.getOrCreate(provider, now);

    if (state.state === "open") {
      if (state.cooldownUntil && state.cooldownUntil > now) {
        return {
          allowed: false as const,
          state: "open" as const,
          retryAfter: state.cooldownUntil,
        };
      }

      await db
        .update(dbEmailProviderCircuitStates)
        .set({
          state: "half_open",
          successCount: 0,
          updatedAt: now,
        })
        .where(eq(dbEmailProviderCircuitStates.provider, provider));

      return { allowed: true as const, state: "half_open" as const };
    }

    return {
      allowed: true as const,
      state: state.state === "half_open" ? "half_open" as const : "closed" as const,
    };
  }

  async recordSuccess(provider: EmailProviderName, now: Date): Promise<void> {
    const state = await this.getOrCreate(provider, now);
    const nextSuccessCount = state.successCount + 1;
    const shouldClose =
      state.state !== "half_open" ||
      nextSuccessCount >= this.config.halfOpenProbeLimit;

    await db
      .update(dbEmailProviderCircuitStates)
      .set({
        state: shouldClose ? "closed" : "half_open",
        failureCount: 0,
        successCount: shouldClose ? 0 : nextSuccessCount,
        openedAt: null,
        cooldownUntil: null,
        lastFailureCategory: null,
        updatedAt: now,
      })
      .where(eq(dbEmailProviderCircuitStates.provider, provider));
  }

  async recordFailure(input: {
    provider: EmailProviderName;
    failureCategory: EmailFailureCategory;
    now: Date;
  }): Promise<void> {
    const state = await this.getOrCreate(input.provider, input.now);
    const failureCount = state.failureCount + 1;
    const shouldOpen =
      state.state === "half_open" || failureCount >= this.config.failureThreshold;

    await db
      .update(dbEmailProviderCircuitStates)
      .set({
        state: shouldOpen ? "open" : "closed",
        failureCount,
        successCount: 0,
        openedAt: shouldOpen ? input.now : state.openedAt,
        cooldownUntil: shouldOpen
          ? new Date(input.now.getTime() + this.config.cooldownSeconds * 1000)
          : state.cooldownUntil,
        lastFailureCategory: input.failureCategory,
        updatedAt: input.now,
      })
      .where(eq(dbEmailProviderCircuitStates.provider, input.provider));
  }

  private async getOrCreate(provider: EmailProviderName, now: Date) {
    const existing = await db
      .select()
      .from(dbEmailProviderCircuitStates)
      .where(eq(dbEmailProviderCircuitStates.provider, provider))
      .limit(1);

    if (existing[0]) return existing[0];

    const inserted = await db
      .insert(dbEmailProviderCircuitStates)
      .values({
        provider,
        state: "closed",
        failureCount: 0,
        successCount: 0,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: dbEmailProviderCircuitStates.provider,
        set: { updatedAt: sql`excluded.updated_at` },
      })
      .returning();

    return inserted[0] ?? {
      provider,
      state: "closed" as const,
      failureCount: 0,
      successCount: 0,
      openedAt: null,
      cooldownUntil: null,
      lastFailureCategory: null,
      updatedAt: now,
    };
  }
}
