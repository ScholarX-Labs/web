import { lessonTasks } from '@/db/schema/lesson-tasks.schema';
import { InferSelectModel } from 'drizzle-orm';

export type LessonTaskRecord = InferSelectModel<typeof lessonTasks>;

export interface ILessonTaskRepository {
  findById(id: string): Promise<LessonTaskRecord | null>;
  findByLessonId(lessonId: string): Promise<LessonTaskRecord[]>;
  create(task: Omit<LessonTaskRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<LessonTaskRecord>;
  update(id: string, task: Partial<Omit<LessonTaskRecord, 'id' | 'createdAt'>>): Promise<LessonTaskRecord>;
  delete(id: string): Promise<void>;
}
