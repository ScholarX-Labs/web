"use client";

import React, { forwardRef } from "react";
import { Drawer as VaulDrawer } from "vaul";
import { cn } from "@/lib/utils";

export const Drawer = VaulDrawer.Root;
export const DrawerTrigger = VaulDrawer.Trigger;
export const DrawerPortal = VaulDrawer.Portal;

// Reusable nested configuration for typical glass sheet
export const DrawerContent = forwardRef<
  React.ElementRef<typeof VaulDrawer.Content>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Content>
>(({ className, children, ...props }, ref) => (
  <VaulDrawer.Portal>
    <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
    <VaulDrawer.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[96%] flex-col rounded-t-[2rem] border border-white/20 bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)]",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
      {children}
    </VaulDrawer.Content>
  </VaulDrawer.Portal>
));
DrawerContent.displayName = "DrawerContent";
