import { z } from "zod";
import {
  executiveActionStatuses,
  executivePageIds,
  publicImpactStatuses,
} from "./executive-types";

export const executiveDatePresetSchema = z.enum([
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "month_to_date",
  "last_month",
  "quarter_to_date",
  "last_quarter",
  "year_to_date",
  "last_year",
  "custom",
]);

export const executiveSortDirectionSchema = z.enum(["asc", "desc"]);

const optionalNonEmptyString = z
  .string()
  .trim()
  .min(1)
  .optional();

const pageNumberSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(25);

export const executivePageQuerySchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
    preset: executiveDatePresetSchema.optional(),
    courseId: optionalNonEmptyString,
    courseCategory: optionalNonEmptyString,
    userRole: optionalNonEmptyString,
    subscriptionStatus: optionalNonEmptyString,
    applicationStatus: optionalNonEmptyString,
    inquiryStatus: optionalNonEmptyString,
    learnerSegment: optionalNonEmptyString,
    acquisitionSource: optionalNonEmptyString,
    page: pageNumberSchema,
    pageSize: pageSizeSchema,
    sort: optionalNonEmptyString,
    direction: executiveSortDirectionSchema.default("desc"),
  })
  .refine((query) => query.from <= query.to, {
    message: "`from` must be before or equal to `to`.",
    path: ["from"],
  });

export type ExecutivePageQuery = z.infer<typeof executivePageQuerySchema>;

export const executivePageIdSchema = z.enum(executivePageIds);

export const executiveExportRequestSchema = z.object({
  pageId: executivePageIdSchema,
  format: z.enum(["csv", "snapshot"]),
  query: executivePageQuerySchema,
  sectionIds: z.array(z.string().trim().min(1)).optional(),
});

export type ExecutiveExportRequest = z.infer<
  typeof executiveExportRequestSchema
>;

export const actionCenterUpdateSchema = z.object({
  status: z.enum(executiveActionStatuses).optional(),
  assignedOwnerId: z.string().trim().min(1).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  resolutionNote: z.string().trim().max(2_000).nullable().optional(),
});

export type ActionCenterUpdateInput = z.infer<
  typeof actionCenterUpdateSchema
>;

export const publicImpactProposalSchema = z.object({
  metricId: z.string().trim().min(1),
  computedValue: z.number().finite(),
  manualOverrideValue: z.number().finite().nullable().optional(),
  sourceDescription: z.string().trim().min(1).max(1_000),
  ownerId: z.string().trim().min(1),
  rationale: z.string().trim().min(1).max(2_000),
});

export type PublicImpactProposalInput = z.infer<
  typeof publicImpactProposalSchema
>;

export const publicImpactReviewSchema = z.object({
  status: z.enum(publicImpactStatuses),
  reason: z.string().trim().min(1).max(2_000).optional(),
});

export type PublicImpactReviewInput = z.infer<
  typeof publicImpactReviewSchema
>;
