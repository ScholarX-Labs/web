import type {
  AdminCourseQuery,
  AdminInquiryQuery,
  AdminOverviewStats,
  AdminSubscriptionQuery,
  AdminUserQuery,
  CourseReport,
  CreateCourseInput,
  CreateLessonInput,
  PaginatedData,
  RevenueReport,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateSubscriptionInput,
  UpdateUserInput,
  UserReport,
} from "./admin-types";

export interface AdminRepository {
  listCourses(query: AdminCourseQuery): Promise<PaginatedData<any>>;
  getCourse(id: string): Promise<any>;
  createCourse(data: CreateCourseInput): Promise<any>;
  updateCourse(id: string, data: UpdateCourseInput, expectedVersion: Date): Promise<any>;
  updateCourseStatus(id: string, status: string): Promise<any>;
  archiveCourse(id: string): Promise<void>;
  enrollUser(courseId: string, email: string): Promise<void>;
  revokeUser(courseId: string, email: string): Promise<void>;

  listLessons(courseId: string): Promise<any[]>;
  getLesson(id: string): Promise<any>;
  createLesson(courseId: string, data: CreateLessonInput): Promise<any>;
  updateLesson(id: string, data: UpdateLessonInput, expectedVersion: Date): Promise<any>;
  toggleLessonVisibility(id: string): Promise<any>;
  archiveLesson(id: string): Promise<void>;
  reorderLessons(courseId: string, lessonIds: string[]): Promise<any[]>;

  listUsers(query: AdminUserQuery): Promise<PaginatedData<any>>;
  getUser(id: string): Promise<any>;
  updateUser(id: string, data: UpdateUserInput): Promise<any>;
  setUserRole(id: string, role: string): Promise<any>;
  blockUser(id: string, reason: string): Promise<any>;
  unblockUser(id: string): Promise<any>;
  suspendUser(id: string): Promise<void>;

  listSubscriptions(query: AdminSubscriptionQuery): Promise<PaginatedData<any>>;
  getSubscription(id: string): Promise<any>;
  updateSubscription(id: string, data: UpdateSubscriptionInput): Promise<any>;

  listInquiries(query: AdminInquiryQuery): Promise<PaginatedData<any>>;
  getInquiry(id: string): Promise<any>;
  updateInquiryStatus(id: string, status: string): Promise<any>;

  getOverviewStats(): Promise<AdminOverviewStats>;
  getRevenueReport(from: Date, to: Date): Promise<RevenueReport>;
  getUserReport(from: Date, to: Date): Promise<UserReport>;
  getCourseReport(from: Date, to: Date): Promise<CourseReport>;
}
