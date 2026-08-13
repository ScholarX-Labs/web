import { TaskConfig, TaskSubmissionStatus, TaskSnapshot } from './lesson-tasks.types';

export interface GradingResult {
  status: TaskSubmissionStatus;
  pointsEarned: number;
}

export interface ITaskTypeStrategy<TConfig extends TaskConfig = TaskConfig, TAnswer = any> {
  getType(): string;
  
  /**
   * Validates the configuration when a task is created or updated by an admin.
   */
  validateConfig(config: unknown): config is TConfig;
  
  /**
   * Validates a learner's submission answer.
   */
  validateSubmission(answer: unknown): answer is TAnswer;
  
  /**
   * Grades the submission and returns the status and points.
   */
  grade(taskSnapshot: TaskSnapshot, answer: TAnswer): GradingResult;
  
  /**
   * Returns true if the task requires manual grading by an instructor.
   */
  requiresManualGrading(): boolean;
}
