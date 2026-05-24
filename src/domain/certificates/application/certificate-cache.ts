import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import {
  invalidateCacheKeys,
  resolvePresenceCacheTtl,
} from "@/lib/cache/cache-semantics";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";
import type {
  PublicCertificateArtifactDto,
  PublicCertificateDto,
} from "./certificate-verification-query.service";

const cache = createServerCache();

export type CachedPublicCertificate =
  | {
      found: true;
      certificateId: string;
      value: PublicCertificateDto;
    }
  | { found: false };

export type CachedCertificateArtifactStatus =
  | {
      found: true;
      value: {
        certificateNumber: string;
        pdf: PublicCertificateArtifactDto;
      };
    }
  | { found: false };

function getPublicCertificateCacheKey(certificateNumber: string): string {
  return cachePolicy.certificates.verificationKey(certificateNumber);
}

function getArtifactStatusCacheKey(certificateNumber: string): string {
  return cachePolicy.certificates.artifactStatusKey(certificateNumber);
}

export async function getCachedPublicCertificate(
  certificateNumber: string,
): Promise<CachedPublicCertificate | null> {
  try {
    return await cache.getJson<CachedPublicCertificate>(
      getPublicCertificateCacheKey(certificateNumber),
    );
  } catch (error) {
    markSharedRedisUnavailable(
      `certificate-cache-public-get:${certificateNumber}`,
      error,
    );
    return null;
  }
}

export async function setCachedPublicCertificate(
  certificateNumber: string,
  value: CachedPublicCertificate,
): Promise<void> {
  try {
    await cache.setJson(
      getPublicCertificateCacheKey(certificateNumber),
      value,
      resolvePresenceCacheTtl({
        found: value.found,
        ttlSeconds: cachePolicy.certificates.verificationTtlSeconds,
        negativeTtlSeconds: cachePolicy.certificates.negativeTtlSeconds,
      }),
    );
  } catch (error) {
    markSharedRedisUnavailable(
      `certificate-cache-public-set:${certificateNumber}`,
      error,
    );
  }
}

export async function getCachedCertificateArtifactStatus(
  certificateNumber: string,
): Promise<CachedCertificateArtifactStatus | null> {
  try {
    return await cache.getJson<CachedCertificateArtifactStatus>(
      getArtifactStatusCacheKey(certificateNumber),
    );
  } catch (error) {
    markSharedRedisUnavailable(
      `certificate-cache-status-get:${certificateNumber}`,
      error,
    );
    return null;
  }
}

export async function setCachedCertificateArtifactStatus(
  certificateNumber: string,
  value: CachedCertificateArtifactStatus,
): Promise<void> {
  try {
    await cache.setJson(
      getArtifactStatusCacheKey(certificateNumber),
      value,
      resolvePresenceCacheTtl({
        found: value.found,
        ttlSeconds: cachePolicy.certificates.artifactStatusTtlSeconds,
        negativeTtlSeconds: cachePolicy.certificates.negativeTtlSeconds,
      }),
    );
  } catch (error) {
    markSharedRedisUnavailable(
      `certificate-cache-status-set:${certificateNumber}`,
      error,
    );
  }
}

export async function invalidatePublicCertificateCache(
  certificateNumber?: string | null,
): Promise<void> {
  if (!certificateNumber) return;

  await invalidateCacheKeys(cache, {
    keys: [
      getPublicCertificateCacheKey(certificateNumber),
      getArtifactStatusCacheKey(certificateNumber),
    ],
    context: `certificate-cache-invalidate:${certificateNumber}`,
  });
}
