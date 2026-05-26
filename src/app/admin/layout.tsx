import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.info("[admin/layout] session-check", {
      hasUser: Boolean(session?.user),
      userId: session?.user?.id ?? null,
      role: session?.user?.role ?? null,
    });
  }

  if (!session?.user) {
    if (isProduction) {
      console.warn("[admin/layout] redirect-signin", {
        reason: "missing-session-user",
      });
    }
    redirect("/auth/signin");
  }

  if (session.user.role !== "admin") {
    if (isProduction) {
      console.warn("[admin/layout] redirect-home", {
        reason: "non-admin-role",
        role: session.user.role ?? null,
      });
    }
    redirect("/");
  }

  return (
    <AdminShell user={session.user}>
      {children}
    </AdminShell>
  );
}
