"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash, Plus } from "lucide-react";
import type { McqTaskConfig } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

interface McqFormProps {
  config: McqTaskConfig;
  onChange: (config: McqTaskConfig) => void;
}

export function McqForm({ config, onChange }: McqFormProps) {
  const handleAddOption = () => {
    const newOption = { id: crypto.randomUUID(), text: "New Option" };
    const options = [...(config.options || []), newOption];
    // If it's the first option, make it correct by default
    const correctOptionId = config.correctOptionId || newOption.id;
    onChange({ ...config, options, correctOptionId });
  };

  const handleRemoveOption = (id: string) => {
    const options = config.options.filter((o) => o.id !== id);
    let correctOptionId = config.correctOptionId;
    if (correctOptionId === id) {
      correctOptionId = options.length > 0 ? options[0].id : "";
    }
    onChange({ ...config, options, correctOptionId });
  };

  const handleUpdateOption = (id: string, text: string) => {
    const options = config.options.map((o) => (o.id === id ? { ...o, text } : o));
    onChange({ ...config, options });
  };

  const handleCorrectChange = (correctOptionId: string) => {
    onChange({ ...config, correctOptionId });
  };

  return (
    <div className="space-y-4">
      <Label>Multiple Choice Options</Label>
      <div className="text-sm text-muted-foreground mb-4">
        Add options and select the correct answer.
      </div>
      
      {(!config.options || config.options.length === 0) ? (
        <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-4 text-center">
          No options added yet.
        </div>
      ) : (
        <RadioGroup value={config.correctOptionId} onValueChange={handleCorrectChange} className="space-y-3">
          {config.options.map((option) => (
            <div key={option.id} className="flex items-center space-x-3 bg-secondary/20 p-2 rounded-md border">
              <RadioGroupItem value={option.id} id={`option-${option.id}`} />
              <Input
                className="flex-1"
                value={option.text}
                onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                placeholder="Option text..."
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(option.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </RadioGroup>
      )}

      <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="mt-2">
        <Plus className="mr-2 h-4 w-4" /> Add Option
      </Button>
    </div>
  );
}
