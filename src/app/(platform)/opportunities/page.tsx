import { Suspense } from "react";
import Filters from "../../../components/opportunities/Filters";
import OpprtunitySection from "@/components/opportunities/OpprtunitySection";
import { OpportunitiesSearchProvider } from "@/providers/opportunities-search-provider";
import OpportunitiesHero from "@/components/opportunities/OpportunitiesHero";
import {
  getOpportunitiesSSR,
  normalizeOpportunitiesSearchParams,
  OPPORTUNITIES_LIST_REVALIDATE,
  toProviderFilters,
} from "@/lib/opportunities/server";

export const revalidate = OPPORTUNITIES_LIST_REVALIDATE;

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | undefined;

async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  // Public route: no session gate so crawlers and first-time visitors get HTML.
  const rawParams = (await searchParams) ?? {};
  const query = normalizeOpportunitiesSearchParams(rawParams);
  const data = await getOpportunitiesSSR(query);

  const initialSearchQuery = query.query ?? "";
  const initialFilters = toProviderFilters(query);

  return (
    <OpportunitiesSearchProvider
      initialSearchQuery={initialSearchQuery}
      initialFilters={initialFilters}
    >
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <OpportunitiesHero />

        {/* filters section */}
        <section className="sticky top-0 z-30 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-4">
            <Suspense fallback={null}>
              <Filters />
            </Suspense>
          </div>
        </section>

        {/* opportunities section — server-seeded, SEO-visible on first paint */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <OpprtunitySection initialData={data} />
          </div>
        </main>
      </div>
    </OpportunitiesSearchProvider>
  );
}

export default OpportunitiesPage;
