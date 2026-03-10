"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { useState, lazy, Suspense } from "react";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((m) => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : null;

// Use a factory function to ensure we don't share QueryClient across requests (for Server Components context)
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Standard defaults for data fetching
        staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
        retry: 1, // Only retry once on failure
        refetchOnWindowFocus: true, // Keep data fresh as user multi-tasks
      },
    },
  });
}

// Ensure the QueryClient persists across hot reloads and renders
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Use lazy init for the query client to avoid recreating it during re-renders
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        {/* Toast Provider */}
        <Toaster position="bottom-right" richColors theme="system" />
        {/* Devtools: only in development, hidden by default */}
        {ReactQueryDevtools && (
          <Suspense>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
