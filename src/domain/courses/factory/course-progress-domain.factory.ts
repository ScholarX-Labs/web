import {
  CertificateService,
  CourseProgressCommandService,
  CourseProgressQueryService,
} from "@/domain/courses/application";
import { NextCertificateRepository } from "@/domain/courses/infrastructure/db/next-certificate.repository";
import { NextCourseProgressRepository } from "@/domain/courses/infrastructure/db/next-course-progress.repository";
import { NextEnrollmentRepository } from "@/domain/courses/infrastructure/db/next-enrollment.repository";

export interface CourseProgressDomainServices {
  progressCommand: CourseProgressCommandService;
  progressQuery: CourseProgressQueryService;
  certificate: CertificateService;
}

export const createCourseProgressDomain = (): CourseProgressDomainServices => {
  const progressRepository = new NextCourseProgressRepository();
  const enrollmentRepository = new NextEnrollmentRepository();
  const certificateRepository = new NextCertificateRepository();

  return {
    progressCommand: new CourseProgressCommandService(
      progressRepository,
      progressRepository,
      enrollmentRepository,
    ),
    progressQuery: new CourseProgressQueryService(progressRepository),
    certificate: new CertificateService(certificateRepository),
  };
};
