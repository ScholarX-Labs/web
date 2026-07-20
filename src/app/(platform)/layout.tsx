import React from "react";
import { PostLoginRedirect } from "@/components/auth/post-login-redirect";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";

/**
 * Platform Route Group Layout
 * This wraps all main user-facing pages (courses, dashboard, etc.)
 * Expected to include standard Navigation Bar and Footer.
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <PostLoginRedirect />
      <EmailVerificationBanner />
      {/* <NavBar /> */}
      <div className="flex-1 w-full">{children}</div>
      {/* <Footer /> */}
    </div>
  );
}
