import type {
  CertificateIssueResult,
  CertificateMetadata,
  CertificateRecord,
  CourseProgressSnapshot,
} from "@/domain/courses/contracts/course-progress.types";

export interface ICertificateRepository {
  findCertificateByUserCourse(
    userId: string,
    courseId: string,
  ): Promise<CertificateRecord | null>;
  findCertificateByNumber(
    certificateNumber: string,
  ): Promise<CertificateRecord | null>;
  createCertificate(params: {
    certificateNumber: string;
    userId: string;
    courseId: string;
    courseProgressId: string;
    metadata: CertificateMetadata;
  }): Promise<CertificateRecord>;
}

export interface CertificateIssueCommand {
  userId: string;
  courseId: string;
  learnerDisplayName: string;
  courseTitle: string;
  progress: CourseProgressSnapshot;
}

export interface ICertificateService {
  issueCertificate(command: CertificateIssueCommand): Promise<CertificateIssueResult>;
}
