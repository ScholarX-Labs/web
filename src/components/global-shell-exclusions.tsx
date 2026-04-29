"use client";

import { usePathname } from "next/navigation";

export function isHeaderExcluded(pathname?: string | null) {
  return pathname?.includes("/lessons/") ?? false;
}

export function GlobalShellExclusions({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLessonPage = isHeaderExcluded(pathname);

  if (isLessonPage) {
    return <>{null}</>;
  }

  return <>{children}</>;
}
