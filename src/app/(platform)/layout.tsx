import { requireSession } from "@/lib/dal";
import React from "react";

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
    <div className="flex min-h-screen flex-col bg-background">
      {/* <NavBar /> */}
      <main className="flex-1 w-full">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
