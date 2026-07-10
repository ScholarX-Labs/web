/**
 * @file copy-button-demo.tsx
 * @description Showcase demo for the copy button component using shadcn UI components.
 *
 * Design Guidelines & Theme Considerations:
 * - Integrates with a "Fancy Dark Mode Toggle" dynamically.
 * - Renders a tooltipped copy button that toggles icons on action.
 */

"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function CopyButtonDemo() {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("https://scholarx.io")
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="relative mx-auto flex h-[200px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center select-none shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Copy Website URL:
        </span>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative disabled:opacity-100"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy to clipboard"}
                disabled={copied}
              >
                <div
                  className={cn(
                    "transition-all duration-200",
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  )}
                >
                  <Check
                    className="stroke-emerald-500"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <div
                  className={cn(
                    "absolute transition-all duration-200",
                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  )}
                >
                  <Copy size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              {copied ? "Copied!" : "Click to copy"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        Copies <code className="rounded bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5">https://scholarx.io</code> to clipboard.
      </p>
    </div>
  )
}
