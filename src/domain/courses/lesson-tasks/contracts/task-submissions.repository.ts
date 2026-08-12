import { taskSubmissions } from '@/db/schema/lesson-tasks.schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type TaskSubmissionRecord = InferSelectModel<typeof taskSubmissions>;
export type NewTaskSubmissionRecord = InferInsertModel<typeof taskSubmissions>;

export interface ITaskSubmissionRepository {
  findById(id: string): Promise<TaskSubmissionRecord | null>;
  findByUserAndTask(userId: string, taskId: string): Promise<TaskSubmissionRecord | null>;
  findByUserAndClientEventId(userId: string, clientEventId: string): Promise<TaskSubmissionRecord | null>;
  findByTaskId(taskId: string): Promise<TaskSubmissionRecord[]>;
  create(submission: NewTaskSubmissionRecord): Promise<TaskSubmissionRecord>;
  update(id: string, submission: Partial<Omit<TaskSubmissionRecord, 'id' | 'createdAt'>>): Promise<TaskSubmissionRecord>;
}
