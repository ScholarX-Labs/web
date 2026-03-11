import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AppRole = "user" | "admin";

const getCachedSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function getSession() {
  return getCachedSession();
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  if (!session.user.phoneNumber) {
    redirect("/auth/collect-phone");
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();

  if (session.user.role !== role) {
    redirect("/forbidden");
  }

  return session;
}

export async function requireAnyRole(roles: AppRole[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.role as AppRole)) {
    redirect("/forbidden");
  }

  return session;
}
