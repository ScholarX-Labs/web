import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { isDevAuthBypassEnabled } from "@/config/dev-auth-bypass";
import Footer from "@/components/Footer";
import PremiumHeader from "@/components/PremiumHeader";
import { GlobalShellExclusions } from "@/components/global-shell-exclusions";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ScholarX",
    template: "%s | ScholarX",
  },
  description: "ScholarX - Premium learning and scholarship discovery platform.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-dvh overflow-x-hidden`}
      >
        <div vaul-drawer-wrapper="" className="min-h-dvh flex flex-col">
          <GlobalShellExclusions>
            <PremiumHeader />
          </GlobalShellExclusions>
          <AppProviders>
            <TooltipProvider>
              <Suspense fallback={null}>
                <AnalyticsTracker />
              </Suspense>
              {isDevAuthBypassEnabled ? (
                <div className="w-full bg-amber-200 px-4 py-2 text-center text-xs font-semibold tracking-wide text-amber-950">
                  DEV_AUTH_BYPASS is ON: authentication and route protection are
                  bypassed.
                </div>
              ) : null}
              <main className="flex-1 flex flex-col pt-16 lg:pt-[72px]">{children}</main>
            </TooltipProvider>
          </AppProviders>
          <GlobalShellExclusions>
            <Footer />
          </GlobalShellExclusions>
        </div>
      </body>
    </html>
  );
}
