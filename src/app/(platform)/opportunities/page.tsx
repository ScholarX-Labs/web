import { Dot, Zap } from "lucide-react";
import Filters from "../../../components/opportunities/Filters";
import { requireSession } from "@/lib/dal";
import Link from "next/link";
import OpprtunitySection from "@/components/opportunities/OpprtunitySection";
import { OpportunitiesSearchProvider } from "@/providers/opportunities-search-provider";
import OpportunitiesSearchInput from "@/components/opportunities/OpportunitiesSearchInput";

async function opportunities() {
  await requireSession();

  return (
    <OpportunitiesSearchProvider>
      <div className="flex flex-col  min-h-screen">
        {/* Header section */}
        <section
          role="region"
          aria-label="Header section that includes search box"
          className="relative bg-cover flex-5 min-h-1/4 flex flex-col"
          style={{
            backgroundImage: "url('/opportunities-hero-bg.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "50% 40%",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative z-10 w-full flex-1 p-1 md:py-2 md:px-10 flex flex-col justify-center items-center text-center md:items-start md:text-start">
            <span className="text-5xl font-bold text-[#55AAD4] mb-4">
              Browse Opportunities
            </span>
            <span className="text-white mb-4">
              Explore all scholarships and opportunities
            </span>

            <OpportunitiesSearchInput />

            <div className="flex flex-row w-1/5 sm:w-2/3 lg:w-1/2 xl:w-2/5 max-w-95 min-w-80 justify-between my-3 items-center">
              <Link
                href="/ai-search"
                className="flex flex-row text-white bg-ring/20 p-2 border-border border-2 cursor-pointer rounded-3xl text-sm text-nowrap gap-2"
              >
                <Zap color="#FFFFFF" /> <span>AI search</span>
              </Link>
              <span className="">
                <Dot color="#808080" />
              </span>
              <span className="text-white text-nowrap text-xs sm:text-lg">
                Powered by intelligent matching
              </span>
            </div>
          </div>
        </section>
        {/* filters section */}
        <section className="shrink-0 px-4 py-3 border-y border-gray-500">
          <Filters />
        </section>
        {/* opportunities section */}
        <section className="flex-20 overflow-auto ">
          <OpprtunitySection />
        </section>
      </div>
    </OpportunitiesSearchProvider>
  );
}

export default opportunities;
