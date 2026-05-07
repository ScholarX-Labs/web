"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-white/10 bg-background/40 p-4 backdrop-blur-3xl lg:p-6">
      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            "relative flex items-end gap-2 overflow-hidden rounded-[24px] border transition-all duration-500",
            "bg-card/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]",
            "focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/10",
            disabled ? "border-transparent opacity-60" : "border-white/20",
          )}
        >
          {/* Subtle animated gradient background behind the input */}
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-sky-500/5 via-transparent to-violet-500/5" />

          <div className="ml-4 mb-3.5 flex shrink-0 items-center justify-center">
            <Sparkles className="size-5 text-sky-500/70" />
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your ideal opportunity..."
            className="flex-1 resize-none bg-transparent py-4 text-[15px] font-medium leading-relaxed tracking-tight text-foreground placeholder:text-muted-foreground focus:outline-hidden disabled:cursor-not-allowed"
            disabled={disabled}
          />

          <div className="mr-2 mb-2 p-1">
            <Button
              size="icon-lg"
              className={cn(
                "size-10 rounded-full transition-all duration-500",
                value.trim() 
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 hover:scale-105 active:scale-95" 
                  : "bg-white/5 text-muted-foreground cursor-not-allowed"
              )}
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
            >
              <Send className={cn("size-4", value.trim() && "animate-in zoom-in-50 duration-300")} />
            </Button>
          </div>
        </div>
        
        <div className="mt-3 flex justify-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Powered by ScholarX Semantic Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
