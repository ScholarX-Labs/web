import { ITaskTypeStrategy, GradingResult } from '../contracts/task-type.strategy';
import { WrittenTaskConfig, TaskSnapshot } from '../contracts/lesson-tasks.types';

export interface WrittenAnswer {
  text: string;
}

export class WrittenStrategy implements ITaskTypeStrategy<WrittenTaskConfig, WrittenAnswer> {
  getType(): string {
    return 'written';
  }

  validateConfig(config: unknown): config is WrittenTaskConfig {
    if (typeof config !== 'object' || config === null) return false;
    const c = config as Record<string, unknown>;
    if (c.minLength !== undefined && typeof c.minLength !== 'number') return false;
    if (c.maxLength !== undefined && typeof c.maxLength !== 'number') return false;
    return true;
  }

  validateSubmission(answer: unknown): answer is WrittenAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const a = answer as Record<string, unknown>;
    return typeof a.text === 'string';
  }

  grade(taskSnapshot: TaskSnapshot, answer: WrittenAnswer): GradingResult {
    const config = taskSnapshot.config as WrittenTaskConfig;
    const length = answer.text.trim().length;
    
    // Automatically fail if constraints aren't met
    if (config.minLength && length < config.minLength) {
      return { status: 'incorrect', pointsEarned: 0 };
    }
    
    if (config.maxLength && length > config.maxLength) {
      return { status: 'incorrect', pointsEarned: 0 };
    }
    
    // For MVP, written questions automatically award participation points if constraints are met
    return {
      status: 'correct',
      pointsEarned: taskSnapshot.pointsAwarded,
    };
  }

  requiresManualGrading(): boolean {
    return false; // MVP: Auto-grades based on constraints
  }
}
