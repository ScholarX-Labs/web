import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  devAuthBypassRole,
  isDevAuthBypassEnabled,
} from "@/config/dev-auth-bypass";
import { ROUTES } from "./routes";

export type AppRole = "user" | "admin";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const DEV_BYPASS_SESSION = {
  session: {
    id: "dev-bypass-session",
    userId: "dev-bypass-user",
    token: "dev-bypass-token",
    expiresAt: new Date("2999-12-31T00:00:00.000Z"),
    createdAt: new Date("1970-01-01T00:00:00.000Z"),
    updatedAt: new Date("1970-01-01T00:00:00.000Z"),
    ipAddress: "127.0.0.1",
    userAgent: "DEV_AUTH_BYPASS",
  },
  user: {
    id: "dev-bypass-user",
    email: "dev-bypass@local.dev",
    emailVerified: true,
    phoneNumber: "+10000000000",
    role: devAuthBypassRole,
    name: "Dev Bypass",
    firstName: "Dev",
    lastName: "Bypass",
    image: null,
    createdAt: new Date("1970-01-01T00:00:00.000Z"),
    updatedAt: new Date("1970-01-01T00:00:00.000Z"),
  },
};

const getCachedSession = cache(async () => {
  try {
    const h = await headers();
    return auth.api.getSession({
      headers: h,
    });
  } catch (error) {
    // Return null if headers cannot be accessed (e.g., during static generation)
    return null;
  }
});

export async function getSession() {
  const session = await getCachedSession();

  if (!session && isDevAuthBypassEnabled) {
    return DEV_BYPASS_SESSION as NonNullable<AuthSession>;
  }

  return session;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.SIGNIN);
  }

  if (!session.user.emailVerified) {
    redirect(ROUTES.VERIFY_EMAIL);
  }

  if (!session.user.phoneNumber) {
    redirect(ROUTES.PHONE_COLLECTION);
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();

  if (!session.user.role || session.user.role !== role) {
    redirect("/forbidden");
  }

  return session;
}

export async function requireAnyRole(roles: AppRole[]) {
  const session = await requireSession();
  const userRole = session.user.role;
  if (!userRole || !roles.includes(userRole as AppRole)) {
    redirect("/forbidden");
  }

  return session;
}
