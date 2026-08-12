import { ILessonTaskRepository } from './contracts/lesson-tasks.repository';
import { ITaskSubmissionRepository } from './contracts/task-submissions.repository';
import { DrizzleTaskRepository } from './infrastructure/db/drizzle-task.repository';
import { DrizzleTaskSubmissionRepository } from './infrastructure/db/drizzle-task-submission.repository';
import { LessonTaskCommandService } from './application/lesson-tasks-command.service';
import { LessonTaskQueryService } from './application/lesson-tasks-query.service';
import { TaskSubmissionExportService } from './application/task-submission-export.service';
import { taskTypeRegistry } from './task-type.registry';

export class LessonTasksFactory {
  private static taskRepository: ILessonTaskRepository;
  private static taskSubmissionRepository: ITaskSubmissionRepository;
  private static commandService: LessonTaskCommandService;
  private static queryService: LessonTaskQueryService;
  private static exportService: TaskSubmissionExportService;

  static getTaskRepository(): ILessonTaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new DrizzleTaskRepository();
    }
    return this.taskRepository;
  }

  static getTaskSubmissionRepository(): ITaskSubmissionRepository {
    if (!this.taskSubmissionRepository) {
      this.taskSubmissionRepository = new DrizzleTaskSubmissionRepository();
    }
    return this.taskSubmissionRepository;
  }

  static getCommandService(): LessonTaskCommandService {
    if (!this.commandService) {
      this.commandService = new LessonTaskCommandService(
        this.getTaskRepository(),
        this.getTaskSubmissionRepository(),
        taskTypeRegistry
      );
    }
    return this.commandService;
  }

  static getQueryService(): LessonTaskQueryService {
    if (!this.queryService) {
      this.queryService = new LessonTaskQueryService(
        this.getTaskRepository(),
        this.getTaskSubmissionRepository()
      );
    }
    return this.queryService;
  }

  static getExportService(): TaskSubmissionExportService {
    if (!this.exportService) {
      this.exportService = new TaskSubmissionExportService(
        this.getTaskSubmissionRepository()
      );
    }
    return this.exportService;
  }
}
