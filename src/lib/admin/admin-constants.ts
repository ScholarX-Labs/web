export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  COURSES: "/admin/courses",
  COURSES_NEW: "/admin/courses/new",
  COURSES_EDIT: (id: string) => `/admin/courses/${id}`,
  COURSE_LESSONS: (courseId: string) => `/admin/courses/${courseId}/lessons`,
  COURSE_LESSONS_NEW: (courseId: string) => `/admin/courses/${courseId}/lessons/new`,
  COURSE_LESSONS_EDIT: (courseId: string, lessonId: string) =>
    `/admin/courses/${courseId}/lessons/${lessonId}`,
  USERS: "/admin/users",
  USERS_DETAIL: (id: string) => `/admin/users/${id}`,
  SUBSCRIPTIONS: "/admin/subscriptions",
  INQUIRIES: "/admin/inquiries",
  REPORTS: "/admin/reports",
  SETTINGS: "/admin/settings",
} as const;

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "sales", label: "Sales" },
  { value: "instructor", label: "Instructor" },
  { value: "user", label: "User" },
] as const;

export const COURSE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
] as const;

export const INQUIRY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "refunded", label: "Refunded" },
] as const;

export const SIDEBAR_NAV = [
  { label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  {
    label: "Courses",
    href: ADMIN_ROUTES.COURSES,
    icon: "BookOpen",
    children: [
      { label: "All Courses", href: ADMIN_ROUTES.COURSES },
      { label: "New Course", href: ADMIN_ROUTES.COURSES_NEW },
    ],
  },
  { label: "Users", href: ADMIN_ROUTES.USERS, icon: "Users" },
  { label: "Subscriptions", href: ADMIN_ROUTES.SUBSCRIPTIONS, icon: "CreditCard" },
  { label: "Inquiries", href: ADMIN_ROUTES.INQUIRIES, icon: "MessageSquare" },
  { label: "Reports", href: ADMIN_ROUTES.REPORTS, icon: "BarChart" },
  { label: "Settings", href: ADMIN_ROUTES.SETTINGS, icon: "Settings" },
] as const;
