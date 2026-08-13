"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WrittenTaskConfig } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

interface WrittenFormProps {
  config: WrittenTaskConfig;
  onChange: (config: WrittenTaskConfig) => void;
}

export function WrittenForm({ config, onChange }: WrittenFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="minLength">Minimum Length (characters)</Label>
        <Input
          id="minLength"
          type="number"
          placeholder="0"
          value={config.minLength || ""}
          onChange={(e) => onChange({ ...config, minLength: parseInt(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">Optional minimum character requirement.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxLength">Maximum Length (characters)</Label>
        <Input
          id="maxLength"
          type="number"
          placeholder="5000"
          value={config.maxLength || ""}
          onChange={(e) => onChange({ ...config, maxLength: parseInt(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">Optional maximum character limit.</p>
      </div>
    </div>
  );
}
