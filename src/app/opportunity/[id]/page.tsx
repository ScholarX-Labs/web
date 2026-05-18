import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOpportunityById } from "@/lib/ai-search/api";
import { OpportunityDetail } from "@/components/opportunity/opportunity-detail";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

const getOpportunity = cache(async (id: string, lang: "en" | "ar") => {
  return getOpportunityById(id, lang);
});

const normalizeLang = (lang?: string): "en" | "ar" =>
  lang === "ar" ? "ar" : "en";

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const { lang } = (await searchParams) ?? {};
  const normalizedLang = normalizeLang(lang);
  const opportunity = await getOpportunity(id, normalizedLang);

  if (!opportunity) {
    return { title: "Opportunity not found" };
  }

  const description = opportunity.description.slice(0, 160);

  return {
    title: `${opportunity.title} - ScholarX`,
    description,
    openGraph: {
      title: opportunity.title,
      description,
      type: "article",
      url: `/opportunity/${id}`,
    },
  };
}

export default async function OpportunityPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { lang } = (await searchParams) ?? {};
  const normalizedLang = normalizeLang(lang);
  const opportunity = await getOpportunity(id, normalizedLang);

  if (!opportunity) {
    notFound();
  }

  const direction = normalizedLang === "ar" ? "rtl" : "ltr";

  return (
    <OpportunityDetail
      opportunity={opportunity}
      lang={normalizedLang}
      dir={direction}
    />
  );
}
