import { db } from '@/db';
import { lessonTasks } from '@/db/schema/lesson-tasks.schema';
import { eq, and } from 'drizzle-orm';
import { ILessonTaskRepository, LessonTaskRecord } from '../../contracts/lesson-tasks.repository';

export class DrizzleTaskRepository implements ILessonTaskRepository {
  async findById(id: string): Promise<LessonTaskRecord | null> {
    const results = await db.select().from(lessonTasks).where(eq(lessonTasks.id, id));
    return results[0] ?? null;
  }

  async findByLessonId(lessonId: string): Promise<LessonTaskRecord[]> {
    return await db
      .select()
      .from(lessonTasks)
      .where(eq(lessonTasks.lessonId, lessonId))
      .orderBy(lessonTasks.sortIndex);
  }

  async create(task: Omit<LessonTaskRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LessonTaskRecord> {
    const results = await db
      .insert(lessonTasks)
      .values(task)
      .returning();
    return results[0];
  }

  async update(id: string, task: Partial<Omit<LessonTaskRecord, 'id' | 'createdAt'>>): Promise<LessonTaskRecord> {
    const results = await db
      .update(lessonTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(lessonTasks.id, id))
      .returning();
    
    if (results.length === 0) {
      throw new Error(`LessonTask with id ${id} not found`);
    }
    
    return results[0];
  }

  async delete(id: string): Promise<void> {
    await db.delete(lessonTasks).where(eq(lessonTasks.id, id));
  }
}
