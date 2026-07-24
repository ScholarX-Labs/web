import { z } from "zod";

// Define safe URL validation to prevent javascript: URI XSS
const safeUrl = z.string().url().refine(val => /^https?:\/\//i.test(val), {
  message: "URL must use http or https protocol"
});

export const CreateCourseSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  description: z.string().min(10).max(5000).optional(),
  category: z.string().min(1).optional(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  requiresForm: z.coerce.boolean().optional(),
  salesInquiry: z.coerce.boolean().optional(),
  imageUrl: safeUrl.optional().or(z.literal("")),
  videoPreviewUrl: safeUrl.optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  instructorId: z.string().uuid().optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  expectedVersion: z.string().datetime(),
});

export const CourseStatusSchema = z.object({
  status: z.enum(["active", "inactive", "archived", "draft"]),
});

export const EnrollUserSchema = z.object({
  email: z.string().email(),
});

export const CreateLessonSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  videoUrl: safeUrl.optional().or(z.literal("")),
  duration: z.coerce.number().int().positive().optional(),
  isPrivate: z.coerce.boolean().optional(),
  status: z.enum(["draft", "staging", "published", "archived"]).optional(),
});

export const UpdateLessonSchema = CreateLessonSchema.partial().extend({
  expectedVersion: z.string().datetime(),
});

export const ReorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().uuid()),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["admin", "sales", "instructor", "user"]),
});

export const BlockUserSchema = z.object({
  reason: z.string().min(1).max(500),
  durationHours: z.coerce.number().int().positive().optional(),
});

export const UpdateInquiryStatusSchema = z.object({
  status: z.enum(["pending", "contacted", "resolved", "closed"]),
});

export const UpdateSubscriptionSchema = z.object({
  status: z.enum(["active", "cancelled", "expired", "refunded"]).optional(),
  amount: z.coerce.number().min(0).optional(),
});

export const ReportRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
