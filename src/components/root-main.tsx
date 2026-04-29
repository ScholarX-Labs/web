"use client";

import { usePathname } from "next/navigation";
import { isHeaderExcluded } from "@/components/global-shell-exclusions";

export function RootMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const headerExcluded = isHeaderExcluded(pathname);

  return (
    <main
      className="flex-1 flex flex-col"
      style={
        headerExcluded ? undefined : { paddingTop: "var(--header-height)" }
      }
    >
      {children}
    </main>
  );
}
