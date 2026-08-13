import { ILessonTaskRepository } from '../contracts/lesson-tasks.repository';
import { ITaskSubmissionRepository } from '../contracts/task-submissions.repository';
import { TaskTypeRegistry } from '../task-type.registry';
import { TaskAnswerableSpecification } from '../models/lesson-tasks.specifications';
import { TaskGradingPolicy } from '../models/task-grading.policy';
import { TaskNotFoundError, TaskNotPublishedError, InvalidSubmissionError } from './lesson-tasks.errors';
import { TaskSubmittedEvent } from '../contracts/lesson-task-events.types';

export class LessonTaskCommandService {
  constructor(
    private readonly taskRepo: ILessonTaskRepository,
    private readonly submissionRepo: ITaskSubmissionRepository,
    private readonly registry: TaskTypeRegistry
  ) {}

  async submitAnswer(
    userId: string,
    courseId: string,
    taskId: string,
    answer: unknown,
    clientEventId?: string
  ): Promise<{ status: string; pointsEarned: number; submissionId: string }> {
    // 1. Fetch Task
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }

    // 2. Validate Specifications
    if (!TaskAnswerableSpecification.isSatisfiedBy(task)) {
      throw new TaskNotPublishedError(taskId);
    }

    // 3. Resolve Strategy
    const strategy = this.registry.getStrategy(task.type);

    // 4. Validate Submission
    if (!strategy.validateSubmission(answer)) {
      throw new InvalidSubmissionError(taskId);
    }

    // Check for idempotency (if clientEventId is provided)
    if (clientEventId) {
      const existing = await this.submissionRepo.findByUserAndClientEventId(userId, clientEventId);
      if (existing) {
        return {
          status: existing.status,
          pointsEarned: existing.pointsEarned,
          submissionId: existing.id
        };
      }
    }

    // 5. Grade
    // Create a TaskSnapshot
    const snapshot = {
      title: task.title,
      type: task.type,
      config: task.config as any,
      pointsAwarded: task.pointsAwarded,
    };
    const gradingResult = TaskGradingPolicy.evaluate(strategy, snapshot, answer);

    // 6. Save Submission
    const submission = await this.submissionRepo.create({
      userId,
      courseId,
      taskId,
      answer,
      status: gradingResult.status,
      pointsEarned: gradingResult.pointsEarned,
      clientEventId: clientEventId || crypto.randomUUID(),
      taskSnapshot: snapshot,
    });

    // 7. Emit Domain Event (in a real app, this would use an EventBus)
    const event: TaskSubmittedEvent = {
      submissionId: submission.id,
      taskId,
      userId,
      courseId,
      clientEventId: submission.clientEventId,
      timestamp: new Date(),
    };
    // TODO: Publish event to trigger Leaderboard processing
    console.log('Domain Event Emitted:', event);

    return {
      status: submission.status,
      pointsEarned: submission.pointsEarned,
      submissionId: submission.id,
    };
  }

  async markAsSkipped(userId: string, courseId: string, taskId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }

    if (!task.isOptional) {
      throw new Error(`Cannot skip mandatory task ${taskId}`);
    }

    await this.submissionRepo.create({
      userId,
      courseId,
      taskId,
      answer: { skipped: true },
      status: 'skipped',
      pointsEarned: 0,
      clientEventId: crypto.randomUUID(),
      taskSnapshot: { config: {}, pointsAwarded: 0 } as any
    });
  }
}
