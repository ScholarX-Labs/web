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
import { Separator } from "@/components/ui/separator";

interface AiSearchSidebarProps {
  onClearConversation: () => void;
}

const HOW_IT_WORKS_STEPS = [
  "Describe your goals",
  "AI scans the database",
  "Get ranked matches",
  "Apply with one click",
];

const DATABASE_STATS = [
  { label: "Total Opportunities", value: "20+", icon: Briefcase },
  { label: "Fully Funded", value: "15", icon: GraduationCap },
  { label: "Countries Covered", value: "12+", icon: Globe },
  { label: "Updated", value: "Today", icon: Clock },
];

export function AiSearchSidebar({ onClearConversation }: AiSearchSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col gap-4">
      <Card className="border-sky-900/40 bg-linear-to-b from-[#0f1f42] via-[#102a50] to-[#0f3655] py-4 text-sky-50">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-linear-to-br from-[#33AACC] to-[#7C3AED] shadow-lg shadow-sky-900/40">
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
        <CardContent className="px-4">
          <p className="text-xs leading-5 text-sky-100/90">
            Our AI analyzes your profile and matches you with high-fit
            scholarships, internships, and conferences.
          </p>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ListChecks className="size-4 text-sky-500" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-2 text-xs">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sky-100 font-medium text-sky-700">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DatabaseZap className="size-4 text-sky-500" />
            Database Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4">
          {DATABASE_STATS.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="size-3.5 text-sky-500" />
                  {item.label}
                </span>
                <span className="font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
              <Separator className="mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="mt-auto w-full text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        onClick={onClearConversation}
      >
        <Trash2 className="size-4" />
        Clear Conversation
      </Button>

      <div className="rounded-xl border border-border/60 bg-card/80 p-3 text-[11px] text-muted-foreground">
        <p className="inline-flex items-center gap-1">
          <BarChart3 className="size-3.5" />
          Scores are AI estimates and should be verified with official sources.
        </p>
      </div>
    </aside>
  );
}
