"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCourse } from "@/hooks/admin/use-admin-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminNewCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (form.price && isNaN(Number(form.price))) newErrors.price = "Price must be a valid number";
    if (Number(form.price) < 0) newErrors.price = "Price cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await createCourse.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
      });
      const course = result as { id?: string };
      if (course?.id) router.push(`/admin/courses/${course.id}`);
    } catch {
      // handled by react-query
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/courses"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Courses
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Course</h1>
        <p className="text-muted-foreground mt-1">Add a new course to your catalog</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Advanced React Patterns"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what students will learn..."
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Web Development"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className={`max-w-xs ${errors.price ? "border-destructive" : ""}`}
              />
              {errors.price && (
                <p className="text-xs text-destructive mt-1">{errors.price}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createCourse.isPending}>
                {createCourse.isPending ? (
                  <>
                    <Loader2 className="size-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
            {createCourse.isError && (
              <p className="text-sm text-destructive">Failed to create course. Please try again.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
