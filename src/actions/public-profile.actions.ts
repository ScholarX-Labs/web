"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import {
  invalidateCacheKeys,
  resolvePresenceCacheTtl,
  type PresenceCachedValue,
} from "@/lib/cache/cache-semantics";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";
import type { PublicProfile } from "@/types/profile.types";

const cache = createServerCache();

type CachedPublicProfile = PresenceCachedValue<PublicProfile, { profile?: never }> extends never
  ? never
  : { found: true; profile: PublicProfile } | { found: false };

export async function invalidatePublicProfileCache(
  username?: string | null,
): Promise<void> {
  if (!username) return;

  try {
    await invalidateCacheKeys(cache, {
      keys: [cachePolicy.profile.key(username)],
      context: `public-profile-invalidate:${username}`,
    });
  } catch (error) {
    console.error("[invalidatePublicProfileCache] Cache invalidation failed", {
      username,
      error,
    });
  }
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  try {
    try {
      const cached = await cache.getJson<CachedPublicProfile>(cachePolicy.profile.key(username));
      if (cached) {
        return cached.found ? cached.profile : null;
      }
    } catch (error) {
      markSharedRedisUnavailable(`public-profile-get:${username}`, error);
    }

    const [profile] = await db
      .select({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        educationLevel: user.educationLevel,
        university: user.university,
        faculty: user.faculty,
        currentInterest: user.currentInterest,
        githubUrl: user.githubUrl,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        twitterUrl: user.twitterUrl,
        linkedinUrl: user.linkedinUrl,
      })
      .from(user)
      .where(
        and(
          eq(user.username, username),
          eq(user.isProfilePublic, true)
        )
      )
      .limit(1);

    if (!profile || !profile.username) {
      try {
        await cache.setJson<CachedPublicProfile>(
          cachePolicy.profile.key(username),
          { found: false },
          resolvePresenceCacheTtl({
            found: false,
            ttlSeconds: cachePolicy.profile.ttlSeconds,
            negativeTtlSeconds: cachePolicy.profile.negativeTtlSeconds,
          }),
        );
      } catch (error) {
        markSharedRedisUnavailable(`public-profile-negative-set:${username}`, error);
      }
      return null;
    }

    const normalized = profile as PublicProfile;
    try {
      await cache.setJson<CachedPublicProfile>(
        cachePolicy.profile.key(username),
        { found: true, profile: normalized },
        resolvePresenceCacheTtl({
          found: true,
          ttlSeconds: cachePolicy.profile.ttlSeconds,
          negativeTtlSeconds: cachePolicy.profile.negativeTtlSeconds,
        }),
      );
    } catch (error) {
      markSharedRedisUnavailable(`public-profile-set:${username}`, error);
    }

    return normalized;
  } catch (error) {
    console.error("[getPublicProfile] Error:", error);
    return null;
  }
}
