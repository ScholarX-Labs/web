"use client";

import { X, File, Link2, Video, Download, ExternalLink, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { DrawerPortal } from "@/components/ui/drawer-sheet";
import { Drawer as VaulDrawer } from "vaul";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  type: "pdf" | "link" | "video" | "code";
  title: string;
  description: string;
  url: string;
  size?: string;
}

const resourceMeta: Record<Resource["type"], { icon: React.ReactNode; color: string; bg: string }> = {
  pdf:   { icon: <File className="w-4 h-4" />,   color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
  code:  { icon: <File className="w-4 h-4" />,   color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  link:  { icon: <Link2 className="w-4 h-4" />,  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  video: { icon: <Video className="w-4 h-4" />,  color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};

const DEFAULT_RESOURCES: Resource[] = [
  { id: "r1", type: "pdf",   title: "Lesson Slides",      description: "Full slide deck for this lesson in PDF format",        url: "#",                  size: "2.4 MB" },
  { id: "r2", type: "code",  title: "Starter Code",       description: "GitHub repository with the starter project template",  url: "https://github.com", size: "ZIP" },
  { id: "r3", type: "link",  title: "React Documentation",description: "Official React 18 docs referenced in this lesson",     url: "https://react.dev" },
  { id: "r4", type: "video", title: "Supplemental Video", description: "Extended walkthrough of the advanced patterns",        url: "#" },
];

interface ResourcesBottomSheetProps {
  resources?: Resource[];
}

/**
 * ResourcesBottomSheet — Vaul-based bottom sheet for lesson resources.
 *
 * Triggered by setResourcesSheetOpen(true) from the store.
 * Replaces navigating to a separate resources tab/page.
 */
export function ResourcesBottomSheet({ resources = DEFAULT_RESOURCES }: ResourcesBottomSheetProps) {
  const { isResourcesSheetOpen, setResourcesSheetOpen } = useUILayoutStore();

  return (
    <VaulDrawer.Root open={isResourcesSheetOpen} onOpenChange={setResourcesSheetOpen}>
      <DrawerPortal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <VaulDrawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[80%] flex-col rounded-t-[2rem] border border-white/10 bg-[#070d1e]/95 backdrop-blur-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.4)]">
          {/* Drag Handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />

          {/* Sheet Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <VaulDrawer.Title className="text-sm font-bold text-white">Resources</VaulDrawer.Title>
                <VaulDrawer.Description className="text-[10px] text-white/40">{resources.length} items</VaulDrawer.Description>
              </div>
            </div>
            <AnimatedButton
              aria-label="Close resources"
              onClick={() => setResourcesSheetOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </AnimatedButton>
          </div>

          {/* Resource List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2 custom-scrollbar">
            {resources.map((resource) => {
              const meta = resourceMeta[resource.type];
              const isExternal = resource.url.startsWith("http");
              return (
                <motion.a
                  key={resource.id}
                  href={resource.url}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  download={!isExternal && resource.url !== "#" ? true : undefined}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05] p-4 transition-all duration-200 cursor-pointer"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", meta.bg, meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">{resource.title}</span>
                    <span className="text-xs text-white/30 truncate">{resource.description}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {resource.size && <span className="text-[10px] font-bold text-white/20 tabular-nums">{resource.size}</span>}
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-60 group-hover:opacity-100", meta.bg, meta.color)}>
                      {isExternal ? <ExternalLink className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </VaulDrawer.Content>
      </DrawerPortal>
    </VaulDrawer.Root>
  );
}
