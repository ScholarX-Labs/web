import { ILessonTaskRepository } from '../contracts/lesson-tasks.repository';
import { ITaskSubmissionRepository } from '../contracts/task-submissions.repository';

export class LessonTaskQueryService {
  constructor(
    private readonly taskRepo: ILessonTaskRepository,
    private readonly submissionRepo: ITaskSubmissionRepository
  ) {}

  async getTasksForLesson(lessonId: string, userId: string) {
    const tasks = await this.taskRepo.findByLessonId(lessonId);
    
    // For each task, check if the user has a submission
    const tasksWithSubmissions = await Promise.all(
      tasks.map(async (task) => {
        const submission = await this.submissionRepo.findByUserAndTask(userId, task.id);
        
        return {
          id: task.id,
          lessonId: task.lessonId,
          title: task.title,
          instructions: task.instructions,
          type: task.type,
          isOptional: task.isOptional,
          pointsAwarded: task.pointsAwarded,
          status: task.status,
          sortIndex: task.sortIndex,
          // Only send config if published. In a real app, you might want to hide the 'correctOptionId' 
          // from the frontend, but for MVP we send it or rely on server-side validation.
          config: task.config, 
          submission: submission ? {
            id: submission.id,
            status: submission.status,
            pointsEarned: submission.pointsEarned,
            answer: submission.answer,
            submittedAt: submission.submittedAt,
          } : null,
        };
      })
    );

    return tasksWithSubmissions;
  }
}
