"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCourse } from "@/hooks/admin/use-admin-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AdminNewCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createCourse.mutateAsync({
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        price: form.price ? Number(form.price) : undefined,
      });
      const course = result as { id?: string };
      if (course?.id) router.push(`/admin/courses/${course.id}`);
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Course</h2>
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={createCourse.isPending}>
              {createCourse.isPending ? "Creating..." : "Create Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
          {createCourse.isError && <p className="text-red-500 text-sm">Failed to create course.</p>}
        </form>
      </Card>
    </div>
  );
}
