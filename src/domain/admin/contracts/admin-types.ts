export interface AdminSession {
  userId: string;
  role: "admin";
  ipAddress?: string;
  userAgent?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminCourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isBlocked?: boolean;
}

export interface AdminSubscriptionQuery {
  page?: number;
  limit?: number;
  status?: string;
  courseId?: string;
}

export interface AdminInquiryQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalCourses: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalInquiries: number;
  pendingInquiries: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
}

export interface RevenueReport {
  totalRevenue: number;
  byMonth: { month: string; revenue: number; count: number }[];
  byCourse: { courseId: string; courseTitle: string; revenue: number; count: number }[];
}

export interface UserReport {
  totalUsers: number;
  byMonth: { month: string; signups: number }[];
  byRole: { role: string; count: number }[];
}

export interface CourseReport {
  totalCourses: number;
  byCategory: { category: string; count: number }[];
  topEnrolled: { courseId: string; courseTitle: string; enrollments: number }[];
  averageCompletionRate: number;
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  price?: number;
  originalPrice?: number;
  requiresForm?: boolean;
  salesInquiry?: boolean;
  imageUrl?: string;
  videoPreviewUrl?: string;
  tags?: string[];
  status?: "active" | "inactive" | "draft";
  instructorId?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  price?: number;
  originalPrice?: number;
  requiresForm?: boolean;
  salesInquiry?: boolean;
  imageUrl?: string;
  videoPreviewUrl?: string;
  tags?: string[];
  status?: "active" | "inactive" | "draft";
  instructorId?: string;
  seoDescription?: string;
  seoKeywords?: string;
  expectedVersion: string;
}

export interface CreateLessonInput {
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isPrivate?: boolean;
  status?: "draft" | "staging" | "published" | "archived";
}

export interface UpdateLessonInput {
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isPrivate?: boolean;
  status?: "draft" | "staging" | "published" | "archived";
  expectedVersion: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface UpdateSubscriptionInput {
  status?: "active" | "cancelled" | "expired" | "refunded";
  amount?: number;
}
