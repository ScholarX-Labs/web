import { ITaskTypeStrategy, GradingResult } from '../contracts/task-type.strategy';
import { McqTaskConfig, TaskSnapshot } from '../contracts/lesson-tasks.types';

export interface McqAnswer {
  selectedOptionId: string;
}

export class McqStrategy implements ITaskTypeStrategy<McqTaskConfig, McqAnswer> {
  getType(): string {
    return 'mcq';
  }

  validateConfig(config: unknown): config is McqTaskConfig {
    if (typeof config !== 'object' || config === null) return false;
    const c = config as Record<string, unknown>;
    if (!Array.isArray(c.options)) return false;
    if (typeof c.correctOptionId !== 'string') return false;
    return true;
  }

  validateSubmission(answer: unknown): answer is McqAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const a = answer as Record<string, unknown>;
    return typeof a.selectedOptionId === 'string';
  }

  grade(taskSnapshot: TaskSnapshot, answer: McqAnswer): GradingResult {
    const config = taskSnapshot.config as McqTaskConfig;
    const isCorrect = config.correctOptionId === answer.selectedOptionId;
    
    return {
      status: isCorrect ? 'correct' : 'incorrect',
      pointsEarned: isCorrect ? taskSnapshot.pointsAwarded : 0,
    };
  }

  requiresManualGrading(): boolean {
    return false;
  }
}
