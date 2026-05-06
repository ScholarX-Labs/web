import { randomUUID } from "crypto";
import { NextCertificatesRepository } from "../infrastructure/db/next-certificates.repository";

export class CompletionWriterService {
  constructor(private readonly repo: NextCertificatesRepository) {}

  /**
   * Called by the lesson progress system when a learner hits 100%.
   * Idempotent: a second call for the same (userId, courseId) is a no-op.
   *
   * @returns The certificateId (new or existing)
   */
  async upsertCourseCompletion(
    userId: string,
    courseId: string,
    stats: { completedLessons: number; completionPercentage: number },
  ): Promise<string> {
    // Check for existing completion — do not overwrite a certificate already issued
    const existing = await this.repo.findByUserAndCourse(userId, courseId);
    if (existing?.completion.certificateId) {
      return existing.completion.certificateId;
    }

    // Generate cert ID once — immutable after this point
    const certificateId = `CERT-${randomUUID().toUpperCase()}`;

    await this.repo.upsertCompletion({
      userId,
      courseId,
      certificateId,
      completedLessons: stats.completedLessons,
      completionPercentage: stats.completionPercentage,
    });

    return certificateId;
  }
}
