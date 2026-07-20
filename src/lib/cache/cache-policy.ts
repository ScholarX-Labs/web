import { createHash } from "node:crypto";
import type { CourseListQuery } from "@/domain/courses/contracts";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeLower(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeCourseListQuery(query: CourseListQuery = {}): {
  page: number;
  limit: number;
  category: string;
} {
  return {
    page: Math.max(query.page ?? 1, 1),
    limit: Math.max(query.limit ?? 3, 1),
    category: normalizeLower(query.category ?? ""),
  };
}

export const cachePolicy = {
  profile: {
    invalidation: "delete",
    ttlSeconds: 60,
    negativeTtlSeconds: 30,
    key(username: string): string {
      return `public-profile:${normalizeLower(username)}`;
    },
  },
  config: {
    ttlSeconds: 60,
    key(key: string): string {
      return `config:${key}`;
    },
  },
  admin: {
    statsTtlSeconds: 30,
    reportTtlSeconds: 60,
    enrollmentTtlSeconds: 30,
    statsKey(): string {
      return "admin:stats:overview";
    },
    reportKey(
      type: "revenue" | "users" | "courses",
      range: { from: string; to: string },
    ): string {
      return `admin:reports:${type}:${hashValue(`${range.from}:${range.to}`)}`;
    },
    enrollmentKey(courseId: string, page: number, limit: number, search?: string, status?: string): string {
      return `admin:enrollments:${courseId}:${page}:${limit}:${search ?? ""}:${status ?? ""}`;
    },
  },
  courses: {
    versionTtlSeconds: 60 * 60 * 24 * 365,
    listTtlSeconds: 60,
    categoriesTtlSeconds: 60,
    detailTtlSeconds: 60,
    listVersionKey(): string {
      return "courses:public:list:version";
    },
    categoriesVersionKey(): string {
      return "courses:public:categories:version";
    },
    detailIdVersionKey(courseId: string): string {
      return `courses:public:detail:id:${courseId}:version`;
    },
    detailSlugVersionKey(slug: string): string {
      return `courses:public:detail:slug:${normalizeLower(slug)}:version`;
    },
    listKey(version: string, query: CourseListQuery = {}): string {
      const normalized = normalizeCourseListQuery(query);
      return [
        "courses:public:list",
        version,
        normalized.page,
        normalized.limit,
        normalized.category || "all",
      ].join(":");
    },
    categoriesKey(version: string): string {
      return ["courses:public:categories", version].join(":");
    },
    detailIdKey(courseId: string, version: string): string {
      return ["courses:public:detail:id", courseId, version].join(":");
    },
    detailSlugKey(slug: string, version: string): string {
      return ["courses:public:detail:slug", normalizeLower(slug), version].join(":");
    },
  },
  certificates: {
    invalidation: "delete",
    verificationTtlSeconds: 60,
    artifactStatusTtlSeconds: 15,
    negativeTtlSeconds: 30,
    verificationKey(certificateNumber: string): string {
      return `certificates:public:verification:${normalizeLower(certificateNumber)}`;
    },
    artifactStatusKey(certificateNumber: string): string {
      return `certificates:public:artifact-status:${normalizeLower(certificateNumber)}`;
    },
  },
  opportunities: {
    detail: {
      invalidation: "ttl-only",
      freshTtlMs: 6 * 60 * 60 * 1000,
      staleTtlMs: 24 * 60 * 60 * 1000,
      cacheTtlSeconds: 24 * 60 * 60,
      key(id: string, lang: "en" | "ar"): string {
        return `opportunities:detail:${lang}:${id}`;
      },
    },
    search: {
      invalidation: "ttl-only",
      freshTtlMs: 5 * 60 * 1000,
      staleTtlMs: 30 * 60 * 1000,
      cacheTtlSeconds: 30 * 60,
      key(query: string): string {
        return `opportunities:search:${hashValue(normalizeLower(query))}`;
      },
    },
    notFound: {
      freshTtlMs: 5 * 60 * 1000,
      staleTtlMs: 15 * 60 * 1000,
      cacheTtlSeconds: 15 * 60,
    },
  },
} as const;
