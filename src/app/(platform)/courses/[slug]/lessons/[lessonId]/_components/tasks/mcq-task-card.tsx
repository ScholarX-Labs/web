"use client";

import { useState } from "react";
import { useLessonTasks } from "@/components/hooks/use-lesson-tasks";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface McqTaskCardProps {
  task: any;
  courseId: string;
  lessonId: string;
}

export function McqTaskCard({ task, courseId, lessonId }: McqTaskCardProps) {
  const { submitAnswer, isSubmitting } = useLessonTasks(courseId, lessonId);
  
  const hasSubmission = !!task.submission;
  const isCorrect = task.submission?.status === "correct";
  const submittedOption = task.submission?.answer?.selectedOptionId;

  const [selectedOption, setSelectedOption] = useState<string>(submittedOption || "");

  const options = task.config?.options || [];

  const handleSubmit = async () => {
    if (!selectedOption) return;
    try {
      await submitAnswer({
        taskId: task.id,
        answer: { selectedOptionId: selectedOption },
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedOption}
        onValueChange={setSelectedOption}
        disabled={hasSubmission || isSubmitting}
        className="space-y-3"
      >
        {options.map((option: any) => {
          const isSelected = selectedOption === option.id;
          const isSubmittedCorrect = hasSubmission && isCorrect && isSelected;
          const isSubmittedIncorrect = hasSubmission && !isCorrect && isSelected;
          // In MVP, we might know the correct answer from config if we passed it
          const actuallyCorrect = hasSubmission && task.config?.correctOptionId === option.id;

          return (
            <div 
              key={option.id} 
              className={cn(
                "flex items-center space-x-3 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                isSelected && !hasSubmission && "border-primary bg-primary/5",
                isSubmittedCorrect && "border-green-500 bg-green-500/10",
                isSubmittedIncorrect && "border-red-500 bg-red-500/10",
                actuallyCorrect && !isSelected && "border-green-500 bg-green-500/10" // highlight correct answer even if wrong
              )}
              onClick={() => {
                if (!hasSubmission && !isSubmitting) setSelectedOption(option.id);
              }}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer font-normal text-base">
                {option.text}
              </Label>
              {isSubmittedCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {isSubmittedIncorrect && <XCircle className="h-5 w-5 text-red-500" />}
              {actuallyCorrect && !isSelected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex justify-end pt-2">
        {!hasSubmission ? (
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedOption || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        ) : (
          <div className="flex items-center space-x-2 text-sm font-medium">
            {isCorrect ? (
              <span className="text-green-600 flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Correct! You earned {task.submission.pointsEarned} points.
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                Incorrect. The correct answer is highlighted.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
