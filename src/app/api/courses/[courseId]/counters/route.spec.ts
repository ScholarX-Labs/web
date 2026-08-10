import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/domain/courses/factory/next-course-domain.factory", () => ({
  createNextCourseDomain: () => ({
    metrics: {
      getCourseMetrics: vi.fn().mockImplementation(async (courseId: string) => {
        if (courseId === "22222222-2222-4222-8222-222222222222") return null;
        if (courseId === "33333333-3333-4333-8333-333333333333")
          throw new Error("Mock DB error");
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
    const courseId = "11111111-1111-4111-8111-111111111111";
    const req = new NextRequest(
      `http://localhost/api/courses/${courseId}/counters`,
    );
    const res = await GET(req, { params: Promise.resolve({ courseId }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enrollmentCount).toBe(150);
  });

  it("returns 404 when not found", async () => {
    const courseId = "22222222-2222-4222-8222-222222222222";
    const req = new NextRequest(
      `http://localhost/api/courses/${courseId}/counters`,
    );
    const res = await GET(req, { params: Promise.resolve({ courseId }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Course metrics not found");
  });

  it("returns 500 when service fails", async () => {
    const courseId = "33333333-3333-4333-8333-333333333333";
    const req = new NextRequest(
      `http://localhost/api/courses/${courseId}/counters`,
    );
    const res = await GET(req, { params: Promise.resolve({ courseId }) });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
  });

  it("returns 400 for a non-UUID courseId", async () => {
    const req = new NextRequest(
      "http://localhost/api/courses/not-a-uuid/counters",
    );
    const res = await GET(req, {
      params: Promise.resolve({ courseId: "not-a-uuid" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid courseId");
  });
});
