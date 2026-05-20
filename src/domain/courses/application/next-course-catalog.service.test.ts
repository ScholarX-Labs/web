import assert from "node:assert/strict";
import test from "node:test";
import { NextCourseCatalogService } from "./next-course-catalog.service";

const activeCourse = {
  id: "00000000-0000-0000-0000-000000000002",
  slug: "ui-ux-design-for-engineers",
  title: "UI/UX Design for Engineers",
  description: "Design course",
  imageUrl: null,
  videoPreviewUrl: null,
  category: "Design",
  level: "Beginner",
  currentPrice: 0,
  originalPrice: null,
  status: "active",
  rating: null,
  totalRatings: null,
  duration: null,
  lessonsCount: 2,
  videosCount: 2,
  studentsCount: null,
  isBestseller: false,
  urgencyText: null,
  tags: [],
  requiresForm: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  instructor: null,
};

const lessons = [
  {
    id: "lesson-id-1",
    courseId: activeCourse.id,
    title: "Design Principles for Developers",
    description: null,
    content: null,
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    duration: 18,
    sortIndex: 1,
    status: "active",
    isArchived: false,
  },
  {
    id: "lesson-id-2",
    courseId: activeCourse.id,
    title: "Typography and Color Theory",
    description: null,
    content: null,
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    duration: 596,
    sortIndex: 2,
    status: "active",
    isArchived: false,
  },
];

const createRepository = () =>
  ({
    findBySlugActive: async () => activeCourse,
    listLessons: async () => lessons,
    findActiveSubscription: async () => ({ id: "sub-1" }),
    findProgressByCourse: async () => [],
    findLessonProgress: async () => null,
  }) as never;

test("getLesson maps DB videoUrl into currentLesson media source", async () => {
  const service = new NextCourseCatalogService(createRepository());

  const result = await service.getLesson(
    activeCourse.slug,
    "1",
    "user-1",
  );

  assert.equal(result.currentLesson.id, "lesson-id-1");
  assert.equal(
    result.currentLesson.media?.src,
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  );
  assert.equal(result.currentLesson.isLocked, false);
});

test("getLesson returns playable media sources for every lesson", async () => {
  const service = new NextCourseCatalogService(createRepository());

  const result = await service.getLesson(
    activeCourse.slug,
    "lesson-id-1",
    "user-1",
  );

  assert.deepEqual(
    result.allLessons.map((lesson) => lesson.media?.src),
    [
      "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    ],
  );
});
