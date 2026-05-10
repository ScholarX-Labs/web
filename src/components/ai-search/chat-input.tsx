"use client";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSubmit: () => void;
}

export function ChatInput({ value, onChange, disabled, onSubmit }: ChatInputProps) {
  return (
    <div className="border-t border-border bg-card/70 px-4 py-3">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          placeholder="Ask about scholarships, internships, fellowships..."
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hero-blue/30 disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-hero-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hero-blue/90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
