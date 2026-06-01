import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { getOpportunityById } from "@/lib/ai-search/api";
import { OpportunityDetail } from "@/components/opportunity/opportunity-detail";

export const revalidate = 60 * 60 * 24;
export const dynamic = "force-static";
export const dynamicParams = true;

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

const getOpportunity = unstable_cache(
  async (id: string, lang: "en" | "ar") => getOpportunityById(id, lang),
  ["opportunity-detail-page"],
  {
    revalidate,
    tags: ["opportunities"],
  },
);

const normalizeLang = (lang?: string): "en" | "ar" =>
  lang === "ar" ? "ar" : "en";

const normalizeOpportunityId = (id?: string): string | null => {
  if (!id) return null;
  const value = id.trim();
  if (!value) return null;
  if (!/^[A-Za-z0-9:_-]+$/.test(value)) return null;
  return value;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = normalizeOpportunityId(rawId);
  if (!id) {
    return { title: "Opportunity not found" };
  }

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

export default async function OpportunityPage({ params, searchParams }: Props) {
  const { id: rawId } = await params;
  const id = normalizeOpportunityId(rawId);
  if (!id) {
    notFound();
  }

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
