import { z } from "zod";

const currentYear = new Date().getUTCFullYear();
const minimumGraduationYear = currentYear - 60;

export const learnerStatusValues = [
  "high_school",
  "undergraduate",
  "graduate",
  "professional",
] as const;

export const learnerStatusSchema = z.enum(learnerStatusValues);

const trimmedString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max);

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return value;
    });

export const courseApplicationInputSchema = z
  .object({
    name: trimmedString(2, 255),
    age: z.coerce.number().int().min(13).max(80),
    email: z.email().trim().max(255),
    phone: trimmedString(7, 50).regex(/^[+\d\s().-]+$/),
    learnerStatus: learnerStatusSchema,
    highSchoolName: optionalTrimmedString(255),
    university: optionalTrimmedString(255),
    faculty: optionalTrimmedString(255),
    graduationYear: z.coerce.number().int().min(minimumGraduationYear).max(currentYear + 1).optional(),
    workField: optionalTrimmedString(255),
    yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
    personalStatement: trimmedString(20, 2000),
    learningGoals: trimmedString(20, 2000),
    background: trimmedString(20, 2000),
    sourceSurface: optionalTrimmedString(50),
    idempotencyKey: optionalTrimmedString(255),
  })
  .superRefine((data, ctx) => {
    if (data.learnerStatus === "high_school" && !data.highSchoolName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["highSchoolName"],
        message: "High school name is required.",
      });
    }

    if (
      data.learnerStatus === "undergraduate" ||
      data.learnerStatus === "graduate"
    ) {
      if (!data.university) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["university"],
          message: "University is required.",
        });
      }

      if (!data.faculty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["faculty"],
          message: "Faculty is required.",
        });
      }
    }

    if (data.learnerStatus === "graduate" && !data.graduationYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduationYear"],
        message: "Graduation year is required.",
      });
    }

    if (
      data.learnerStatus === "graduate" &&
      data.graduationYear &&
      data.age < 20
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["age"],
        message: "Graduate applicants must enter a realistic age.",
      });
    }

    if (data.learnerStatus === "professional") {
      if (!data.workField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["workField"],
          message: "Work field is required.",
        });
      }

      if (data.yearsOfExperience === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["yearsOfExperience"],
          message: "Years of experience is required.",
        });
      }

      if (
        data.yearsOfExperience !== undefined &&
        data.yearsOfExperience > Math.max(data.age - 14, 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["yearsOfExperience"],
          message: "Years of experience is too high for the entered age.",
        });
      }
    }
  });

export type CourseApplicationInput = z.infer<typeof courseApplicationInputSchema>;

export type CourseApplicationStatusSummary = {
  id: string;
  status: string;
  submittedAt: string;
};
