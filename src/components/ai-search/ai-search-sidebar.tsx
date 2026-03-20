import Image from "next/image";
import {
  BarChart3,
  DatabaseZap,
  Trash2,
  ListChecks,
  Briefcase,
  GraduationCap,
  Globe,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface AiSearchSidebarProps {
  onClearConversation: () => void;
}

const HOW_IT_WORKS_STEPS = [
  {
    text: "Describe your goals",
    color: "bg-sky-100 text-sky-700 group-hover:bg-sky-500",
  },
  {
    text: "AI scans the database",
    color: "bg-violet-100 text-violet-700 group-hover:bg-violet-500",
  },
  {
    text: "Get ranked matches",
    color: "bg-pink-100 text-pink-700 group-hover:bg-pink-500",
  },
  {
    text: "Apply with one click",
    color: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500",
  },
];

const DATABASE_STATS = [
  { label: "Total Opportunities", value: "20+", icon: Briefcase },
  { label: "Fully Funded", value: "15", icon: GraduationCap },
  { label: "Countries Covered", value: "12+", icon: Globe },
  { label: "Updated", value: "Today", icon: Clock },
];

function AiSearchHeroCard() {
  return (
    <Card className="group relative overflow-hidden border-sky-900/40 bg-linear-to-b from-[#0f1f42] via-[#102a50] to-[#0f3655] py-4 text-sky-50 shadow-lg">
      <div className="absolute -inset-0.5 bg-sky-400/10 opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 blur-[20px]" />
      <CardHeader className="relative z-10 px-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-linear-to-br from-[#33AACC] to-[#7C3AED] shadow-[0_0_15px_rgba(51,170,204,0.3)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-[0_0_25px_rgba(51,170,204,0.6)] group-hover:scale-105">
            <Image
              src="/AI_Robot_03_3d%201.svg"
              alt="AI Search"
              width={48}
              height={48}
              className="size-14"
            />
          </span>
          AI Search
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 px-4">
        <p className="text-xs leading-5 text-sky-100/90">
          Our AI analyzes your profile and matches you with high-fit
          scholarships, internships, and conferences.
        </p>
      </CardContent>
    </Card>
  );
}

function HowItWorksCard() {
  return (
    <Card className="py-2 border-white/5 bg-transparent shadow-none">
      <CardHeader className="px-4 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm text-foreground/80 font-medium tracking-tight">
          <ListChecks className="size-4 text-sky-500" />
          How it works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-3">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <div
            key={step.text}
            className="group flex cursor-default items-center gap-3 text-xs transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02]"
          >
            <span
              className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full font-medium transition-colors group-hover:text-white ${step.color}`}
            >
              {index + 1}
            </span>
            <span className="text-muted-foreground transition-colors group-hover:text-foreground font-medium">
              {step.text}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DatabaseStatsCard() {
  return (
    <Card className="py-2 border-white/5 bg-transparent shadow-none">
      <CardHeader className="px-4 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm text-foreground/80 font-medium tracking-tight">
          <DatabaseZap className="size-4 text-sky-500" />
          Database Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-3">
        {DATABASE_STATS.map((item) => (
          <div
            key={item.label}
            className="group transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between text-xs my-1">
              <span className="flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground font-medium">
                <item.icon className="size-3.5 text-sky-500 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:text-sky-400" />
                {item.label}
              </span>
              <span className="font-semibold text-foreground/90 transition-colors group-hover:text-foreground">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AiSearchSidebar({ onClearConversation }: AiSearchSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col gap-6">
      <AiSearchHeroCard />
      <HowItWorksCard />
      <DatabaseStatsCard />

      <Button
        variant="outline"
        className="mt-auto w-full border-white/5 text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive active:scale-95"
        onClick={onClearConversation}
      >
        <Trash2 className="size-4" />
        Clear Conversation
      </Button>

      <div className="rounded-xl border border-white/5 bg-transparent p-3 text-[11px] text-muted-foreground/80">
        <p className="inline-flex items-start gap-1.5 leading-relaxed">
          <BarChart3 className="size-3.5 shrink-0 mt-0.5" />
          Scores are AI estimates and should be verified with official sources.
        </p>
      </div>
    </aside>
  );
}
