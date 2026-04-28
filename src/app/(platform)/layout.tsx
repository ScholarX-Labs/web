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
    <div className="flex flex-1 flex-col bg-background">
      {/* <NavBar /> */}
      <div className="flex-1 w-full">{children}</div>
      {/* <Footer /> */}
    </div>
  );
}
