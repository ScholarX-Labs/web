import { LessonTaskRecord } from '../contracts/lesson-tasks.repository';

export class TaskPublishedSpecification {
  static isSatisfiedBy(task: LessonTaskRecord): boolean {
    return task.status === 'published';
  }
}

export class TaskAnswerableSpecification {
  static isSatisfiedBy(task: LessonTaskRecord): boolean {
    return task.status === 'published';
  }
}
