import {
  NextCourseCatalogService,
  NextCourseEnrollmentService,
} from "@/domain/courses/application";
import { NextCoursesRepository } from "@/domain/courses/infrastructure/db/next-courses.repository";

export interface NextCourseDomainServices {
  catalog: NextCourseCatalogService;
  enrollment: NextCourseEnrollmentService;
}

export const createNextCourseDomain = (): NextCourseDomainServices => {
  const repository = new NextCoursesRepository();

  return {
    catalog: new NextCourseCatalogService(repository),
    enrollment: new NextCourseEnrollmentService(repository),
  };
};
