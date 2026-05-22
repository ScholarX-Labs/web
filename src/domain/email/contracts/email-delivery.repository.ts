import type {
  AppendDeliveryEventInput,
  CreateAttemptInput,
  CreateDeliveryInput,
  EmailDeliveryAttemptRecord,
  EmailDeliveryDetail,
  EmailDeliveryRecord,
  FinishAttemptAndMarkAcceptedInput,
  FinishAttemptInput,
  MarkFailedInput,
  ScheduleRetryInput,
} from "./email-types";

export interface EmailDeliveryRepository {
  createOrReuseDelivery(request: CreateDeliveryInput): Promise<EmailDeliveryRecord>;
  claimDeliveryForSending(input: {
    deliveryId: string;
    workerId: string;
    lockedUntil: Date;
    expectedStateVersion?: number;
  }): Promise<EmailDeliveryRecord | null>;
  claimRetryableBatch(input: {
    workerId: string;
    lockedUntil: Date;
    limit: number;
    now: Date;
  }): Promise<EmailDeliveryRecord[]>;
  createAttempt(input: CreateAttemptInput): Promise<EmailDeliveryAttemptRecord>;
  finishAttempt(input: FinishAttemptInput): Promise<void>;
  finishAttemptAndMarkAccepted(
    input: FinishAttemptAndMarkAcceptedInput,
  ): Promise<EmailDeliveryRecord>;
  markFailed(input: MarkFailedInput): Promise<EmailDeliveryRecord>;
  scheduleRetry(input: ScheduleRetryInput): Promise<EmailDeliveryRecord>;
  appendEvent(input: AppendDeliveryEventInput): Promise<void>;
  findByRequestId(requestId: string): Promise<EmailDeliveryDetail | null>;
  repairAcceptedAttemptOrphans(input: { now: Date; limit: number }): Promise<number>;
  releaseExpiredLeases(input: { now: Date; limit: number }): Promise<number>;
}
