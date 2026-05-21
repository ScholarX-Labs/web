import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

export interface CourseApplicationFormData {
  name: string;
  age: number;
  email: string;
  phone: string;
  learnerStatus: "high_school" | "undergraduate" | "graduate" | "professional";
  highSchoolName?: string;
  university?: string;
  faculty?: string;
  graduationYear?: number;
  workField?: string;
  yearsOfExperience?: number;
  personalStatement: string;
  learningGoals: string;
  background: string;
}

export const executeCourseApplication = async (
  context: EnrollmentContext,
  formData: CourseApplicationFormData,
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    const response = await apiClient.submitApplication(context.course.id, {
      name: formData.name,
      age: formData.age,
      email: formData.email,
      phone: formData.phone,
      learnerStatus: formData.learnerStatus,
      highSchoolName: formData.highSchoolName,
      university: formData.university,
      faculty: formData.faculty,
      graduationYear: formData.graduationYear,
      workField: formData.workField,
      yearsOfExperience: formData.yearsOfExperience,
      personalStatement: formData.personalStatement,
      learningGoals: formData.learningGoals,
      background: formData.background,
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
    });

    emitEnrollmentEvent({
      event: "enroll_submission_succeeded",
      timestamp: Date.now(),
      courseId: context.course.id,
      sourceSurface: context.command.source,
      correlationId: context.command.correlationId,
    });

    return {
      ok: true,
      mode: "application",
      nextAction: response.enrolledImmediately ? "resume_learning" : "none",
      message:
        response.message ||
        "Your application has been submitted. Our team will review it shortly.",
    };
  } catch (error) {
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "application",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
