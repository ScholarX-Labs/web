"use client";

import { usePathname } from "next/navigation";

export function GlobalShellExclusions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLessonPage = pathname?.includes("/lessons/");
  
  if (isLessonPage) {
    return <>{null}</>;
  }

  return <>{children}</>;
}
