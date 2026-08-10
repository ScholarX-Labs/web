import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import { bumpVersionCacheKeys } from "@/lib/cache/cache-semantics";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";
import type { CourseCategory, CourseListQuery } from "@/domain/courses/contracts";
import type { Course } from "@/types/course.types";
import type { PaginatedCoursesApiResponse } from "@/lib/api/courses.service";
import type { CounterCacheEntry } from "../contracts/course-metrics.contract";

const cache = createServerCache();

async function getVersion(key: string): Promise<string> {
  try {
    const version = await cache.getJson<string>(key);
    return version ?? "1";
  } catch (error) {
    markSharedRedisUnavailable(`course-cache-version-get:${key}`, error);
    return "1";
  }
}

function listVersionKey() {
  return cachePolicy.courses.listVersionKey();
}

function categoriesVersionKey() {
  return cachePolicy.courses.categoriesVersionKey();
}

function detailIdVersionKey(courseId: string) {
  return cachePolicy.courses.detailIdVersionKey(courseId);
}

function detailSlugVersionKey(slug: string) {
  return cachePolicy.courses.detailSlugVersionKey(slug);
}

export async function getPublicCourseListCacheKey(
  query: CourseListQuery = {},
): Promise<string> {
  const version = await getVersion(listVersionKey());
  return cachePolicy.courses.listKey(version, query);
}

export async function getPublicCourseCategoriesCacheKey(): Promise<string> {
  const version = await getVersion(categoriesVersionKey());
  return cachePolicy.courses.categoriesKey(version);
}

export async function getPublicCourseDetailByIdCacheKey(courseId: string): Promise<string> {
  const version = await getVersion(detailIdVersionKey(courseId));
  return cachePolicy.courses.detailIdKey(courseId, version);
}

export async function getPublicCourseDetailBySlugCacheKey(slug: string): Promise<string> {
  const version = await getVersion(detailSlugVersionKey(slug));
  return cachePolicy.courses.detailSlugKey(slug, version);
}

export async function getCachedPublicCourseList(
  query: CourseListQuery = {},
): Promise<PaginatedCoursesApiResponse | null> {
  try {
    return await cache.getJson<PaginatedCoursesApiResponse>(
      await getPublicCourseListCacheKey(query),
    );
  } catch (error) {
    markSharedRedisUnavailable("course-cache-list-get", error);
    return null;
  }
}

export async function setCachedPublicCourseList(
  query: CourseListQuery,
  value: PaginatedCoursesApiResponse,
): Promise<void> {
  try {
    await cache.setJson(
      await getPublicCourseListCacheKey(query),
      value,
      cachePolicy.courses.listTtlSeconds,
    );
  } catch (error) {
    markSharedRedisUnavailable("course-cache-list-set", error);
  }
}

export async function getCachedPublicCourseCategories(): Promise<CourseCategory[] | null> {
  try {
    return await cache.getJson<CourseCategory[]>(
      await getPublicCourseCategoriesCacheKey(),
    );
  } catch (error) {
    markSharedRedisUnavailable("course-cache-categories-get", error);
    return null;
  }
}

export async function setCachedPublicCourseCategories(value: CourseCategory[]): Promise<void> {
  try {
    await cache.setJson(
      await getPublicCourseCategoriesCacheKey(),
      value,
      cachePolicy.courses.categoriesTtlSeconds,
    );
  } catch (error) {
    markSharedRedisUnavailable("course-cache-categories-set", error);
  }
}

export async function getCachedPublicCourseDetailById(courseId: string): Promise<Course | null> {
  try {
    return await cache.getJson<Course>(
      await getPublicCourseDetailByIdCacheKey(courseId),
    );
  } catch (error) {
    markSharedRedisUnavailable(`course-cache-detail-id-get:${courseId}`, error);
    return null;
  }
}

export async function setCachedPublicCourseDetailById(
  courseId: string,
  value: Course,
): Promise<void> {
  try {
    await cache.setJson(
      await getPublicCourseDetailByIdCacheKey(courseId),
      value,
      cachePolicy.courses.detailTtlSeconds,
    );
  } catch (error) {
    markSharedRedisUnavailable(`course-cache-detail-id-set:${courseId}`, error);
  }
}

export async function getCachedPublicCourseDetailBySlug(slug: string): Promise<Course | null> {
  try {
    return await cache.getJson<Course>(
      await getPublicCourseDetailBySlugCacheKey(slug),
    );
  } catch (error) {
    markSharedRedisUnavailable(`course-cache-detail-slug-get:${slug}`, error);
    return null;
  }
}

export async function setCachedPublicCourseDetailBySlug(
  slug: string,
  value: Course,
): Promise<void> {
  try {
    await cache.setJson(
      await getPublicCourseDetailBySlugCacheKey(slug),
      value,
      cachePolicy.courses.detailTtlSeconds,
    );
  } catch (error) {
    markSharedRedisUnavailable(`course-cache-detail-slug-set:${slug}`, error);
  }
}

export async function invalidatePublicCourseListCache(): Promise<void> {
  await bumpVersionCacheKeys(cache, {
    keys: [listVersionKey(), categoriesVersionKey()],
    ttlSeconds: cachePolicy.courses.versionTtlSeconds,
    context: "course-cache-version-bump:list",
  });
}

export async function invalidatePublicCourseDetailCache(input: {
  courseId?: string | null;
  slug?: string | null;
}): Promise<void> {
  await bumpVersionCacheKeys(cache, {
    keys: [
      input.courseId ? detailIdVersionKey(input.courseId) : null,
      input.slug ? detailSlugVersionKey(input.slug) : null,
    ],
    ttlSeconds: cachePolicy.courses.versionTtlSeconds,
    context: "course-cache-version-bump:detail",
  });
}

const counterKey = (courseId: string) =>
  cachePolicy.courses.counters.key(courseId);
const counterTtl = cachePolicy.courses.counters.ttlSeconds;

export async function getCachedCourseMetrics(
  courseId: string
): Promise<CounterCacheEntry | null> {
  try {
    return await cache.getJson<CounterCacheEntry>(counterKey(courseId));
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-get:${courseId}`, error);
    return null;
  }
}

export async function setCachedCourseMetrics(
  courseId: string,
  entry: CounterCacheEntry
): Promise<void> {
  try {
    await cache.setJson(counterKey(courseId), entry, counterTtl);
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-set:${courseId}`, error);
    // Non-fatal: page still renders with DB data
  }
}

export async function invalidateCourseMetricsCache(
  courseId: string
): Promise<void> {
  try {
    await cache.delete(counterKey(courseId));
  } catch (error) {
    markSharedRedisUnavailable(`course-counter-invalidate:${courseId}`, error);
  }
}
