export type LoadingPhase = 
  | 'idle'
  | 'threshold_wait'
  | 'active_loading'
  | 'completing'
  | 'error'
  | 'dismissed';

export type LoadingContextDomain = 
  | 'scholarship_match'
  | 'course_enrollment'
  | 'video_processing'
  | 'certificate_generation'
  | 'general';

export interface LoadingStage {
  id: string;
  order: number;
  label: string;
  description?: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface LoadingSessionState {
  sessionId: string;
  contextDomain: LoadingContextDomain;
  phase: LoadingPhase;
  startTime: number;
  elapsedMs: number;
  stages: LoadingStage[];
  currentStageIndex: number;
  errorDetails?: {
    message: string;
    code?: string;
    canRetry: boolean;
  };
}

export interface TriviaOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TriviaQuestion {
  id: string;
  category: LoadingContextDomain;
  question: string;
  options: TriviaOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserLoaderPreferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  gameModeEnabled: boolean;
  simplifiedAnimations: boolean;
}

export interface LearnerSessionStats {
  triviaAnswered: number;
  triviaCorrect: number;
  bubblesPopped: number;
  totalProductiveWaitTimeMs: number;
}
