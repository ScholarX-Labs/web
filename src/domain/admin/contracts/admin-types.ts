export const PAYMENT_METHODS = ["cash", "card", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  autoApproveApplications?: boolean;
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
  autoApproveApplications?: boolean;
  salesInquiry?: boolean;
  imageUrl?: string;
  videoPreviewUrl?: string;
  tags?: string[];
  status?: "active" | "inactive" | "draft";
  instructorId?: string;
  seoDescription?: string;
  seoKeywords?: string;
  expectedVersion?: string;
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
  expectedVersion?: string;
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

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface EnrollWithPaymentInput {
  courseId: string;
  userId?: string;
  email?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  enrolledBy: string;
}

export interface CashEnrollmentResult {
  user: { id: string; email: string; firstName: string; lastName: string };
  password?: string;
  course: { id: string; title: string };
  enrollment: {
    id: string;
    courseId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    enrolledAt: Date;
  };
}

export interface AdminEnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  amount: number | null;
  paymentMethod: string | null;
  paymentId: string | null;
  status: string | null;
  isActive: boolean | null;
  enrolledAt: Date | null;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export interface EnrollmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
