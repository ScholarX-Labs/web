import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

const loadHandlersFactory = async () => {
  process.env.DATABASE_URL ??=
    "postgres://postgres:postgres@localhost:5432/postgres";
  const mod = await import("./route");
  return mod.createCoursesRouteHandlers;
};

const createFakeDomain = (capture?: {
  onList?: (query?: unknown, userId?: string) => void;
}) => ({
  catalog: {
    list: async (_query?: unknown, _userId?: string) => {
      capture?.onList?.(_query, _userId);
      return {
        items: [
          {
            id: "course-1",
            slug: "course-1",
            title: "Course 1",
            description: "DB-backed course",
            thumbnail: "",
            currentPrice: 0,
            price: 0,
            requiresForm: false,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isSubscribed: false,
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCourses: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },
    getFeatured: async () => ({
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCourses: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    getScholarX: async () => ({
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCourses: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    search: async () => ({
      items: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCourses: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    getBySlug: async (slug: string) => ({
      id: slug,
      slug,
      title: `Course ${slug}`,
      description: "DB-backed course",
      thumbnail: "",
      currentPrice: 0,
      price: 0,
      requiresForm: false,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSubscribed: false,
    }),
    getById: async (id: string) => ({
      id,
      slug: id,
      title: `Course ${id}`,
      description: "DB-backed course",
      thumbnail: "",
      currentPrice: 0,
      price: 0,
      requiresForm: false,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSubscribed: false,
    }),
    getEnrollmentStatus: async (courseId: string, userId: string) => ({
      isSubscribed: true,
      courseId,
      userId,
    }),
  },
  enrollment: {
    enrollFree: async () => ({ success: true }),
    initPaidEnrollment: async () => ({ success: true }),
    initApplicationEnrollment: async () => ({ success: true }),
  },
});

test("GET /api/courses returns paginated DB-backed payload", async () => {
  const createCoursesRouteHandlers = await loadHandlersFactory();
  let capturedQuery: Record<string, unknown> | undefined;
  let capturedUserId: string | undefined;

  const handlers = createCoursesRouteHandlers({
    getSession: async () => ({ user: { id: "user-1" } }),
    createDomain: () =>
      createFakeDomain({
        onList: (query, userId) => {
          capturedQuery = query as Record<string, unknown> | undefined;
          capturedUserId = userId;
        },
      }) as never,
  });

  const request = new NextRequest(
    "http://localhost:3000/api/courses?page=2&limit=5&category=Featured",
  );

  const response = await handlers.GET(request, {
    params: Promise.resolve({ path: [] }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, "course-1");
  assert.deepEqual(capturedQuery, { page: 2, limit: 5, category: "Featured" });
  assert.equal(capturedUserId, "user-1");
});

test("GET /api/courses/slug/:slug returns single course", async () => {
  const createCoursesRouteHandlers = await loadHandlersFactory();
  const handlers = createCoursesRouteHandlers({
    getSession: async () => ({ user: { id: "user-2" } }),
    createDomain: () => createFakeDomain() as never,
  });

  const request = new NextRequest(
    "http://localhost:3000/api/courses/slug/course-abc",
  );
  const response = await handlers.GET(request, {
    params: Promise.resolve({ path: ["slug", "course-abc"] }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.id, "course-abc");
  assert.equal(body.slug, "course-abc");
});

test("GET /api/courses/:id/subscription-status requires authentication", async () => {
  const createCoursesRouteHandlers = await loadHandlersFactory();
  const handlers = createCoursesRouteHandlers({
    getSession: async () => null,
    createDomain: () => createFakeDomain() as never,
  });

  const request = new NextRequest(
    "http://localhost:3000/api/courses/course-1/subscription-status",
  );
  const response = await handlers.GET(request, {
    params: Promise.resolve({ path: ["course-1", "subscription-status"] }),
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body?.error?.code, "UNAUTHORIZED");
});
