"use client";
import React, { useEffect, useRef, useState } from "react";

type Option = { displayName: string; value: string };

export default function SimpleDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex h-9 w-full items-center justify-between rounded-4xl border border-input bg-white px-3 text-sm text-black hover:cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="ml-2 text-gray-500"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-2 w-full max-h-64 max-w-[calc(100vw-2rem)] overflow-auto rounded-md border bg-white p-2 shadow-lg"
          style={{ whiteSpace: "normal" }}
        >
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50 hover:cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(opt.value, e.target.checked)}
                  className="h-4 w-4 flex-none hover:cursor-pointer"
                />
                <span className="truncate hover:cursor-pointer">
                  {opt.displayName}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
