"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordDisplay({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
      <Input
        type={visible ? "text" : "password"}
        value={password}
        readOnly
        className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => setVisible(!visible)}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={handleCopy}
        title="Copy password"
      >
        {copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
    </div>
  );
}
