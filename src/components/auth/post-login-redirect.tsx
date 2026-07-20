"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

const SKIP_PATHS = new Set([
  ROUTES.SIGNIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.CHANGE_PASSWORD,
  ROUTES.PHONE_COLLECTION,
]);

export function PostLoginRedirect() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending || !session?.user) return;
    
    if (SKIP_PATHS.has(pathname)) return;

    // Prevent onboarding redirects for users already engaged in authenticated tasks
    const isAuthSurface = ["/admin", "/profile", "/my-courses"].some(prefix => 
      pathname.startsWith(prefix)
    );
    if (isAuthSurface) return;

    const user = session.user as Record<string, unknown>;

    if (!user.emailVerified && !user.emailVerificationSkipped) {
      router.replace(ROUTES.VERIFY_EMAIL);
      return;
    }

    if (user.mustChangePassword) {
      router.replace(ROUTES.CHANGE_PASSWORD);
      return;
    }

    if (!user.phoneNumber) {
      router.replace(ROUTES.PHONE_COLLECTION);
    }
  }, [session, isPending, pathname, router]);

  return null;
}
