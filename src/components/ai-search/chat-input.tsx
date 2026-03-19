"use client";

import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({
  value,
  disabled,
  onChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <div className="border-t border-white/5 bg-background/40 p-3 backdrop-blur-3xl lg:p-4">
      <div className="mx-auto flex w-full max-w-7xl items-end gap-2 rounded-2xl border border-white/10 bg-background/50 backdrop-blur-lg px-2 py-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:shadow-[0_0_20px_rgba(51,170,204,0.15)] shadow-sm">
        <Textarea
          value={value}
          disabled={disabled}
          placeholder="Describe what you are looking for..."
          className="max-h-40 min-h-10 resize-none border-none px-2 py-2 text-sm shadow-none focus-visible:ring-0"
          onChange={(event) => onChange(event.target.value)}
          onInput={(event) => {
            const element = event.currentTarget;
            element.style.height = "auto";
            element.style.height = `${element.scrollHeight}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />

        <Button
          size="icon"
          onClick={onSubmit}
          disabled={disabled || value.trim().length === 0}
          className="rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.5)]"
          aria-label="Send message"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>

      <p className="mx-auto mt-2 w-full max-w-7xl text-center text-[11px] text-muted-foreground">
        AI results are for guidance only. Always verify details on official
        websites.
      </p>
    </div>
  );
}
