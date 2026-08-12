"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SwotTaskConfig } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

interface SwotFormProps {
  config: SwotTaskConfig;
  onChange: (config: SwotTaskConfig) => void;
}

export function SwotForm({ config, onChange }: SwotFormProps) {
  const toggleCategory = (category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', checked: boolean) => {
    let requiredCategories = config.requiredCategories || [];
    if (checked) {
      if (!requiredCategories.includes(category)) {
        requiredCategories = [...requiredCategories, category];
      }
    } else {
      requiredCategories = requiredCategories.filter(c => c !== category);
    }
    onChange({ ...config, requiredCategories });
  };

  const isChecked = (category: string) => {
    return (config.requiredCategories || []).includes(category as any);
  };

  return (
    <div className="space-y-4">
      <Label>Required Quadrants</Label>
      <div className="text-sm text-muted-foreground mb-4">
        Select which quadrants learners must fill out. Unchecked quadrants will be optional.
      </div>
      
      <div className="space-y-3">
        {['strengths', 'weaknesses', 'opportunities', 'threats'].map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={`swot-${category}`}
              checked={isChecked(category)}
              onCheckedChange={(checked: boolean | "indeterminate") => toggleCategory(category as any, checked === true)}
            />
            <Label htmlFor={`swot-${category}`} className="capitalize">
              {category}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
