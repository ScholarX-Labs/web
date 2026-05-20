import type {
  ICourseProgressQueryRepository,
} from "@/domain/courses/contracts/course-progress.repository";

export class CourseProgressQueryService {
  constructor(private readonly repository: ICourseProgressQueryRepository) {}

  getCourseProgress(userId: string, courseId: string) {
    return this.repository.getCourseProgress(userId, courseId);
  }

  getLessonProgress(userId: string, courseId: string) {
    return this.repository.getLessonProgress(userId, courseId);
  }
}
