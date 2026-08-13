export class LessonTaskError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LessonTaskError';
  }
}

export class TaskNotFoundError extends LessonTaskError {
  constructor(taskId: string) {
    super(`Lesson task with ID ${taskId} was not found.`, 'TASK_NOT_FOUND');
  }
}

export class TaskNotPublishedError extends LessonTaskError {
  constructor(taskId: string) {
    super(`Lesson task with ID ${taskId} is not published and cannot be answered.`, 'TASK_NOT_PUBLISHED');
  }
}

export class InvalidSubmissionError extends LessonTaskError {
  constructor(taskId: string) {
    super(`The submission for task ${taskId} is invalid according to its strategy.`, 'INVALID_SUBMISSION');
  }
}
