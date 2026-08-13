import { db } from '@/db';
import { taskSubmissions } from '@/db/schema/lesson-tasks.schema';
import { eq, and } from 'drizzle-orm';
import { ITaskSubmissionRepository, TaskSubmissionRecord, NewTaskSubmissionRecord } from '../../contracts/task-submissions.repository';

export class DrizzleTaskSubmissionRepository implements ITaskSubmissionRepository {
  async findById(id: string): Promise<TaskSubmissionRecord | null> {
    const results = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, id));
    return results[0] ?? null;
  }

  async findByUserAndTask(userId: string, taskId: string): Promise<TaskSubmissionRecord | null> {
    const results = await db
      .select()
      .from(taskSubmissions)
      .where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.taskId, taskId)));
    return results[0] ?? null;
  }

  async findByUserAndClientEventId(userId: string, clientEventId: string): Promise<TaskSubmissionRecord | null> {
    const results = await db
      .select()
      .from(taskSubmissions)
      .where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.clientEventId, clientEventId)));
    return results[0] ?? null;
  }

  async findByTaskId(taskId: string): Promise<TaskSubmissionRecord[]> {
    return await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, taskId));
  }

  async create(submission: NewTaskSubmissionRecord): Promise<TaskSubmissionRecord> {
    const results = await db
      .insert(taskSubmissions)
      .values(submission)
      .returning();
    return results[0];
  }

  async update(id: string, submission: Partial<Omit<TaskSubmissionRecord, 'id' | 'createdAt'>>): Promise<TaskSubmissionRecord> {
    const results = await db
      .update(taskSubmissions)
      .set({ ...submission, updatedAt: new Date() })
      .where(eq(taskSubmissions.id, id))
      .returning();
      
    if (results.length === 0) {
      throw new Error(`TaskSubmission with id ${id} not found`);
    }
    
    return results[0];
  }
}
