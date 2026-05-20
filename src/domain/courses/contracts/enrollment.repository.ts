import type { SubscriptionRecord } from "@/domain/courses/contracts/course-progress.types";

export interface IEnrollmentReadRepository {
  findActiveSubscription(
    userId: string,
    courseId: string,
  ): Promise<SubscriptionRecord | null>;
}
