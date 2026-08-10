import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/domain/courses/factory/next-course-domain.factory", () => ({
  createNextCourseDomain: () => ({
    metrics: {
      getCourseMetrics: vi.fn().mockImplementation(async (courseId: string) => {
        if (courseId === "not-found") return null;
        if (courseId === "error") throw new Error("Mock DB error");
        return {
          courseId,
          enrollmentCount: 150,
          ratingCount: 60,
          averageRating: 4.8,
          source: "live",
        };
      }),
    },
  }),
}));

describe("GET /api/courses/[courseId]/counters", () => {
  it("returns metrics when found", async () => {
    const req = new NextRequest("http://localhost/api/courses/123/counters");
    const res = await GET(req, { params: Promise.resolve({ courseId: "123" }) });
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.enrollmentCount).toBe(150);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=300, stale-while-revalidate=60");
  });

  it("returns 404 when not found", async () => {
    const req = new NextRequest("http://localhost/api/courses/not-found/counters");
    const res = await GET(req, { params: Promise.resolve({ courseId: "not-found" }) });
    
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });

  it("returns 500 when service fails", async () => {
    const req = new NextRequest("http://localhost/api/courses/error/counters");
    const res = await GET(req, { params: Promise.resolve({ courseId: "error" }) });
    
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("service_unavailable");
  });
});
