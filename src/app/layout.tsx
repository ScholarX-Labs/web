import type { Metadata } from "next";
import { Cairo, Geist_Mono, Inter } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { isDevAuthBypassEnabled } from "@/config/dev-auth-bypass";
import Footer from "@/components/Footer";
import PremiumHeader from "@/components/PremiumHeader";
import { GlobalShellExclusions } from "@/components/global-shell-exclusions";
import { RootIntlProvider } from "@/components/root-intl-provider";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { Suspense } from "react";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/locales";
import { loadMessages } from "@/lib/i18n/messages";
import NextTopLoader from "nextjs-toploader";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

function resolveMetadataBase(): URL {
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (rawBase) {
    try {
      const parsed = new URL(rawBase);
      return new URL("/", parsed);
    } catch {
      // Ignore invalid or relative API base values, and fall back to a safe origin.
    }
  }

  return new URL("https://scholarx.com");
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "ScholarX",
    template: "%s | ScholarX",
  },
  description: "ScholarX - Premium learning and scholarship discovery platform.",
  applicationName: "ScholarX",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "ScholarX",
    title: "ScholarX",
    description: "Premium learning and scholarship discovery platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholarX",
    description: "Premium learning and scholarship discovery platform.",
  },
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
  const requestedLocale = await getLocale().catch(() => DEFAULT_LOCALE);
  const locale = isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const localeConfig = LOCALE_CONFIG[locale];

  // Load all locale message sets so the client-side RootIntlProvider can
  // switch between them reactively on SPA navigation (e.g. locale switcher).
  const localeMessages = Object.fromEntries(
    await Promise.all(
      SUPPORTED_LOCALES.map(async (l) => [l, await loadMessages(l)])
    )
  ) as Record<string, ReturnType<typeof loadMessages> extends Promise<infer T> ? T : never>;

  return (
    // suppressHydrationWarning: lang/dir are updated by RootIntlProvider's
    // useEffect on client navigation; the initial SSR value may differ from the
    // client-detected locale if the user navigates before hydration completes.
    <html lang={localeConfig.bcp47Tag} dir={localeConfig.dir} suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${geistMono.variable} ${cairo.variable} antialiased flex flex-col min-h-dvh overflow-x-hidden`}
      >
        <NextTopLoader color="#4F46E5" height={3} showSpinner={false} />
        <RootIntlProvider localeMessages={localeMessages}>
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
                <SpeedInsights />
              </TooltipProvider>
            </AppProviders>
            <GlobalShellExclusions>
              <Footer />
            </GlobalShellExclusions>
          </div>
        </RootIntlProvider>
        <Analytics />
      </body>
    </html>
  );
}
