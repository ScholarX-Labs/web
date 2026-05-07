"use client";

import { use } from "react";
import Link from "next/link";
import { useAdminLessons } from "@/hooks/admin/use-admin-lessons";
import { Button } from "@/components/ui/button";

export default function AdminCourseLessonsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data, isLoading } = useAdminLessons(courseId);
  const lessons = (data as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/courses/${courseId}`} className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Course</Link>
          <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
        </div>
        <Link href={`/admin/courses/${courseId}/lessons/new`}>
          <Button>Add Lesson</Button>
        </Link>
      </div>
      {isLoading && <p className="text-gray-500">Loading lessons...</p>}
      {!isLoading && lessons.length === 0 && <p className="text-gray-500">No lessons yet.</p>}
      {lessons.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson: Record<string, unknown>, idx: number) => (
                <tr key={String(lesson.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{String(lesson.title ?? "")}</td>
                  <td className="px-4 py-3 text-sm">{lesson.isPublished ? "Published" : "Draft"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
