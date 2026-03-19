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
    <div className="border-t border-border bg-card/80 p-3 backdrop-blur supports-backdrop-filter:bg-card/70 lg:p-4">
      <div className="mx-auto flex w-full max-w-7xl items-end gap-2 rounded-2xl border border-border bg-background px-2 py-2">
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
          className="rounded-full bg-sky-500 text-white hover:bg-sky-600"
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
