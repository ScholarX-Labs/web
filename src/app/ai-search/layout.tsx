import type { Metadata } from "next";
import "./ai-search.css";
import { Providers } from "@/components/ai-search/providers";

export const metadata: Metadata = {
  title: "ScholarAI — AI-Powered Scholarship Search",
  description:
    "The premium discovery engine for global scholarships and academic opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Providers>{children}</Providers>;
}
