export interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

export interface Course {
  id: string;
  _id?: string; // MongoDB fallback
  title: string;
  slug: string;
  description: string;
  thumbnail: string;

  // Pricing
  price?: number;
  currentPrice?: number;
  amount?: number; // Legacy V1 support

  // Metadata for V2 Cards
  category?: string;
  instructor?: Instructor;
  rating?: number;
  totalRatings?: number;
  videosCount?: number;
  lessonsCount?: number;
  studentsCount?: number;
  originalPrice?: number;

  // Premium Layout & Engagements features
  videoPreviewUrl?: string;
  isBestseller?: boolean;
  urgencyText?: string;
  tags?: string[];

  // Access and Status
  requiresForm: boolean;
  isPublished: boolean;

  // Details
  level?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string;

  createdAt: string;
  updatedAt: string;
  isSubscribed?: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string | Course;
  userId: string;
  status: "active" | "completed" | "cancelled" | "pending";
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  courseId: string;
}

// Lightweight lesson summary used by the lesson UI (server-provided)
export interface LessonSummary {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  media?: {
    src: string;
    thumbnails?: string | string[];
    poster?: string;
  };
}
