"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CourseRichTextProps {
  text?: string | null;
  className?: string;
}

const INLINE_TOKEN_REGEX =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE_TOKEN_REGEX)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={`b-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={`i-${key++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`c-${key++}`}
          className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[0.92em] dark:bg-slate-800/80"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const label = match[2];
      const href = match[3];
      nodes.push(
        <a
          key={`a-${key++}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-current/40 underline-offset-4 hover:decoration-current"
        >
          {label}
        </a>,
      );
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function CourseRichText({ text, className }: CourseRichTextProps) {
  const source = (text ?? "").trim();
  if (!source) return null;

  const lines = source.split(/\r?\n/).map((line) => line.trimEnd());
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
        items.push(<li key={`li-${i}`}>{parseInline(itemText)}</li>);
        i += 1;
      }

      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
          {items}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^[-*]\s+/.test(lines[i].trim())) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {parseInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return <div className={cn("space-y-3", className)}>{blocks}</div>;
}

