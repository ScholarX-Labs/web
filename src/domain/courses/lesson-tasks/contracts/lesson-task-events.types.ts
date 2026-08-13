import { TaskSubmissionStatus } from './lesson-tasks.types';

export interface TaskSubmittedEvent {
  submissionId: string;
  userId: string;
  taskId: string;
  courseId: string;
  clientEventId: string;
  timestamp: Date;
}

export interface TaskGradedEvent {
  submissionId: string;
  userId: string;
  taskId: string;
  courseId: string;
  status: TaskSubmissionStatus;
  pointsEarned: number;
  timestamp: Date;
}
