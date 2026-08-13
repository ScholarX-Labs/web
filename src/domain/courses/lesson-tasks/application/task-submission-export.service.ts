import { ITaskSubmissionRepository } from '../contracts/task-submissions.repository';

export class TaskSubmissionExportService {
  constructor(private readonly submissionRepository: ITaskSubmissionRepository) {}

  async exportSubmissionsAsJson(taskId: string): Promise<string> {
    const submissions = await this.submissionRepository.findByTaskId(taskId);
    return JSON.stringify(submissions, null, 2);
  }

  async exportSubmissionsAsCsv(taskId: string): Promise<string> {
    const submissions = await this.submissionRepository.findByTaskId(taskId);
    if (submissions.length === 0) {
      return 'id,userId,taskId,status,pointsAwarded,createdAt,updatedAt\n';
    }

    // Extract headers based on the first record
    const headers = ['id', 'userId', 'taskId', 'status', 'pointsAwarded', 'createdAt', 'updatedAt'];
    
    const rows = submissions.map((sub) => {
      return [
        sub.id,
        sub.userId,
        sub.taskId,
        sub.status,
        sub.pointsEarned,
        sub.createdAt.toISOString(),
        sub.updatedAt.toISOString(),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
