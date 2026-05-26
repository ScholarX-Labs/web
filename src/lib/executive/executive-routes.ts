import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";

export const EXECUTIVE_ADMIN_ROUTES = {
  ROOT: "/admin/executive",
  OVERVIEW: "/admin/executive",
  USERS: "/admin/executive/users",
  COURSES_LESSONS: "/admin/executive/courses-lessons",
  LEARNER_PROGRESS: "/admin/executive/learner-progress",
  OPPORTUNITIES_AI: "/admin/executive/opportunities-ai",
  TECHNICAL_HEALTH: "/admin/executive/technical-health",
  ACTION_CENTER: "/admin/executive/action-center",
  PUBLIC_GROWTH: "/admin/executive/public-growth",
  TEAM_OPERATIONS: "/admin/executive/team-operations",
  FINANCE: "/admin/executive/finance",
} as const;

export const EXECUTIVE_API_ROUTES = {
  ROOT: "/api/admin/executive",
  EXPORT: "/api/admin/executive/export",
  PUBLIC_IMPACT_METRICS: "/api/admin/executive/public-growth/metrics",
} as const;

export const executivePageRouteById: Record<ExecutivePageId, string> = {
  overview: EXECUTIVE_ADMIN_ROUTES.OVERVIEW,
  users: EXECUTIVE_ADMIN_ROUTES.USERS,
  courses_lessons: EXECUTIVE_ADMIN_ROUTES.COURSES_LESSONS,
  learner_progress: EXECUTIVE_ADMIN_ROUTES.LEARNER_PROGRESS,
  opportunities_ai: EXECUTIVE_ADMIN_ROUTES.OPPORTUNITIES_AI,
  technical_health: EXECUTIVE_ADMIN_ROUTES.TECHNICAL_HEALTH,
  action_center: EXECUTIVE_ADMIN_ROUTES.ACTION_CENTER,
  public_growth: EXECUTIVE_ADMIN_ROUTES.PUBLIC_GROWTH,
  team_operations: EXECUTIVE_ADMIN_ROUTES.TEAM_OPERATIONS,
  finance: EXECUTIVE_ADMIN_ROUTES.FINANCE,
};

export function getExecutiveApiPath(pageId: ExecutivePageId): string {
  return pageId === "overview"
    ? EXECUTIVE_API_ROUTES.ROOT + "/overview"
    : EXECUTIVE_API_ROUTES.ROOT + "/" + pageId.replaceAll("_", "-");
}
