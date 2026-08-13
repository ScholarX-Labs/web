"use client";

import { useState } from "react";
import { useLessonTasks } from "@/components/hooks/use-lesson-tasks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SwotTaskCardProps {
  task: any;
  courseId: string;
  lessonId: string;
}

export function SwotTaskCard({ task, courseId, lessonId }: SwotTaskCardProps) {
  const { submitAnswer, isSubmitting } = useLessonTasks(courseId, lessonId);
  
  const hasSubmission = !!task.submission;
  const isCorrect = task.submission?.status === "correct";
  const answer = task.submission?.answer || { strengths: [], weaknesses: [], opportunities: [], threats: [] };

  const [strengths, setStrengths] = useState(answer.strengths.join("\n"));
  const [weaknesses, setWeaknesses] = useState(answer.weaknesses.join("\n"));
  const [opportunities, setOpportunities] = useState(answer.opportunities.join("\n"));
  const [threats, setThreats] = useState(answer.threats.join("\n"));

  const requiredCategories = task.config?.requiredCategories || [];
  
  const isInvalid = requiredCategories.some((cat: string) => {
    if (cat === "strengths") return !strengths.trim();
    if (cat === "weaknesses") return !weaknesses.trim();
    if (cat === "opportunities") return !opportunities.trim();
    if (cat === "threats") return !threats.trim();
    return false;
  });

  const handleSubmit = async () => {
    if (isInvalid) return;
    try {
      await submitAnswer({
        taskId: task.id,
        answer: { 
          strengths: strengths.split("\n").filter(Boolean), 
          weaknesses: weaknesses.split("\n").filter(Boolean), 
          opportunities: opportunities.split("\n").filter(Boolean), 
          threats: threats.split("\n").filter(Boolean) 
        },
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  const renderTextarea = (id: string, label: string, value: string, setValue: (val: string) => void) => {
    const isRequired = requiredCategories.includes(id);
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="font-semibold">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={hasSubmission || isSubmitting}
          placeholder="Enter one item per line..."
          className="min-h-[100px]"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderTextarea("strengths", "Strengths", strengths, setStrengths)}
        {renderTextarea("weaknesses", "Weaknesses", weaknesses, setWeaknesses)}
        {renderTextarea("opportunities", "Opportunities", opportunities, setOpportunities)}
        {renderTextarea("threats", "Threats", threats, setThreats)}
      </div>

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
              "Submit Analysis"
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
          </div>
        )}
      </div>
    </div>
  );
}
