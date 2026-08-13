import { ITaskTypeStrategy } from '../contracts/task-type.strategy';
import { TaskSnapshot } from '../contracts/lesson-tasks.types';

export class TaskGradingPolicy {
  /**
   * Applies the strategy to grade a learner's submission.
   */
  static evaluate(strategy: ITaskTypeStrategy, taskSnapshot: TaskSnapshot, answer: any) {
    if (!strategy.validateSubmission(answer)) {
      throw new Error('Invalid submission format for the given task type.');
    }

    if (strategy.requiresManualGrading()) {
      return {
        status: 'pending' as const,
        pointsEarned: 0,
      };
    }

    return strategy.grade(taskSnapshot, answer);
  }
}
