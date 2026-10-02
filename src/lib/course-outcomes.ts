import { Course } from "@/types/course.types";

/**
 * Standard scholarship preparation fallbacks when a course does not have custom outcomes configured.
 * Aligned with academic scholarships, university admissions, and fellowship mentoring.
 */
export const DEFAULT_SCHOLARSHIP_OUTCOMES_EN = [
  "Master competitive scholarship and fellowship application strategies",
  "Craft compelling personal statements, research proposals, and academic CVs",
  "Navigate university admissions criteria, supervisor outreach, and funding deadlines",
  "Prepare for academic and committee interviews with proven evaluation frameworks",
  "Tailor recommendation letters and portfolio evidence to specific donor rubrics",
];

export const DEFAULT_SCHOLARSHIP_OUTCOMES_AR = [
  "إتقان استراتيجيات التقديم على المنح الدراسية والزمالات التنافسية",
  "صياغة خطابات النوايا والمقترحات البحثية والسير الذاتية الأكاديمية باحترافية",
  "فهم معايير القبول الجامعي والتواصل مع المشرفين ومواعيد التمويل النهائية",
  "الاستعداد لمقابلات لجان المنح الأكاديمية وفق أطر تقييم مدروسة",
  "مواءمة خطابات التوصية والأدلة الداعمة مع معايير ومتطلبات الجهات المانحة",
];

export interface ResolveOutcomesOptions {
  limit?: number;
  locale?: string;
  fallbackList?: string[];
}

/**
 * Resolves course learning outcomes dynamically.
 * If the course entity provides non-empty learningOutcomes, it returns those items.
 * Otherwise, it falls back to domain-appropriate scholarship preparation outcomes.
 */
export function resolveCourseLearningOutcomes(
  course?: Pick<Course, "learningOutcomes"> | null,
  options?: ResolveOutcomesOptions,
): string[] {
  const custom = course?.learningOutcomes;

  if (Array.isArray(custom) && custom.length > 0) {
    const validCustom = custom.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    if (validCustom.length > 0) {
      return options?.limit ? validCustom.slice(0, options.limit) : validCustom;
    }
  }

  const defaultList =
    options?.fallbackList ??
    (options?.locale === "ar" ? DEFAULT_SCHOLARSHIP_OUTCOMES_AR : DEFAULT_SCHOLARSHIP_OUTCOMES_EN);

  return options?.limit ? defaultList.slice(0, options.limit) : defaultList;
}
