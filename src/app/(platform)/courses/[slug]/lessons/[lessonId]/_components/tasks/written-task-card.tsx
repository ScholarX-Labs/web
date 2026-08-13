"use client";

import { useState } from "react";
import { useLessonTasks } from "@/components/hooks/use-lesson-tasks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface WrittenTaskCardProps {
  task: any;
  courseId: string;
  lessonId: string;
}

export function WrittenTaskCard({ task, courseId, lessonId }: WrittenTaskCardProps) {
  const { submitAnswer, isSubmitting } = useLessonTasks(courseId, lessonId);
  
  const hasSubmission = !!task.submission;
  const isCorrect = task.submission?.status === "correct";
  const isPending = task.submission?.status === "pending";
  const submittedText = task.submission?.answer?.text || "";

  const [text, setText] = useState<string>(submittedText);

  const minLength = task.config?.minLength || 0;
  const maxLength = task.config?.maxLength;
  
  const currentLength = text.trim().length;
  const isTooShort = currentLength > 0 && currentLength < minLength;
  const isTooLong = maxLength && currentLength > maxLength;
  const isInvalid = isTooShort || isTooLong || currentLength === 0;

  const handleSubmit = async () => {
    if (isInvalid) return;
    try {
      await submitAnswer({
        taskId: task.id,
        answer: { text },
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder="Write your answer here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={hasSubmission || isSubmitting}
          className="min-h-[150px] resize-y"
        />
        {!hasSubmission && (
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {currentLength} {maxLength ? `/ ${maxLength}` : ""} chars
          </div>
        )}
      </div>

      {!hasSubmission && (isTooShort || isTooLong) && (
        <p className="text-sm text-red-500">
          {isTooShort && `Answer must be at least ${minLength} characters.`}
          {isTooLong && `Answer cannot exceed ${maxLength} characters.`}
        </p>
      )}

      <div className="flex justify-end pt-2">
        {!hasSubmission ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isInvalid || isSubmitting}
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
            {isCorrect && (
              <span className="text-green-600 flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submitted! You earned {task.submission.pointsEarned} points.
              </span>
            )}
            {isPending && (
              <span className="text-amber-600 flex items-center">
                <Loader2 className="mr-2 h-4 w-4" />
                Submitted! Pending manual review.
              </span>
            )}
            {!isCorrect && !isPending && (
              <span className="text-red-600 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                Submission rejected. Please review requirements.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
