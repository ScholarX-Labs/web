import { ITaskTypeStrategy, GradingResult } from '../contracts/task-type.strategy';
import { SwotTaskConfig, TaskSnapshot } from '../contracts/lesson-tasks.types';

export interface SwotAnswer {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export class SwotStrategy implements ITaskTypeStrategy<SwotTaskConfig, SwotAnswer> {
  getType(): string {
    return 'swot';
  }

  validateConfig(config: unknown): config is SwotTaskConfig {
    if (typeof config !== 'object' || config === null) return false;
    const c = config as Record<string, unknown>;
    if (!Array.isArray(c.requiredCategories)) return false;
    return true;
  }

  validateSubmission(answer: unknown): answer is SwotAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const a = answer as Record<string, unknown>;
    return Array.isArray(a.strengths) && Array.isArray(a.weaknesses) && Array.isArray(a.opportunities) && Array.isArray(a.threats);
  }

  grade(taskSnapshot: TaskSnapshot, answer: SwotAnswer): GradingResult {
    const config = taskSnapshot.config as SwotTaskConfig;
    
    // Check if required categories have at least one entry
    for (const category of config.requiredCategories) {
      if (answer[category].length === 0) {
        return { status: 'incorrect', pointsEarned: 0 };
      }
    }
    
    // For MVP, participation points are automatically awarded if requirements are met
    return {
      status: 'correct',
      pointsEarned: taskSnapshot.pointsAwarded,
    };
  }

  requiresManualGrading(): boolean {
    return false; // MVP: Auto-grades based on participation
  }
}
