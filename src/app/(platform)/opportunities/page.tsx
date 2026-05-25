import Filters from "../../../components/opportunities/Filters";
import { requireSession } from "@/lib/dal";
import OpprtunitySection from "@/components/opportunities/OpprtunitySection";
import { OpportunitiesSearchProvider } from "@/providers/opportunities-search-provider";
import OpportunitiesHero from "@/components/opportunities/OpportunitiesHero";

async function opportunities() {
  await requireSession();

  return (
    <OpportunitiesSearchProvider>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <OpportunitiesHero />

        {/* filters section */}
        <section className="sticky top-0 z-30 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-4">
            <Filters />
          </div>
        </section>

        {/* opportunities section */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <OpprtunitySection />
          </div>
        </main>
      </div>
    </OpportunitiesSearchProvider>
  );
}

export default opportunities;
