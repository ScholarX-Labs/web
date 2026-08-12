export type TaskType = 'mcq' | 'written' | 'swot' | 'link';
export type TaskStatus = 'draft' | 'published' | 'archived';
export type TaskSubmissionStatus = 'pending' | 'correct' | 'incorrect' | 'skipped';

export interface McqTaskConfig {
  options: { id: string; text: string }[];
  correctOptionId: string;
}

export interface WrittenTaskConfig {
  minLength?: number;
  maxLength?: number;
}

export interface SwotTaskConfig {
  requiredCategories: ('strengths' | 'weaknesses' | 'opportunities' | 'threats')[];
}

export interface LinkTaskConfig {
  urlTemplate?: string;
  requireValidUrl?: boolean;
}

export type TaskConfig = McqTaskConfig | WrittenTaskConfig | SwotTaskConfig | LinkTaskConfig;

export interface TaskSnapshot {
  title: string;
  instructions?: string | null;
  config: TaskConfig;
  pointsAwarded: number;
}

export interface AdminTaskPayload {
  id: string;
  lessonId: string;
  type: TaskType;
  title: string;
  instructions: string | null;
  pointsAwarded: number;
  isOptional: boolean;
  sortIndex: number;
  status: TaskStatus;
  config: TaskConfig;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
