"use client";
export const dynamic = "force-dynamic";

import { use, useMemo } from "react";
import Link from "next/link";
import { useAdminLessons } from "@/hooks/admin/use-admin-lessons";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Plus } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  isPublished: boolean;
}

export default function AdminCourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data, isLoading } = useAdminLessons(courseId);
  const lessons = (data as Lesson[] | undefined) ?? [];

  const columns = useMemo<ColumnDef<Lesson>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isPublished ? "default" : "secondary"}>
            {row.original.isPublished ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Link href={`/admin/courses/${courseId}/lessons/${row.original.id}`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [courseId],
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/courses/${courseId}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Course
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
            <p className="text-muted-foreground mt-1">Manage course curriculum</p>
          </div>
          <Link href={`/admin/courses/${courseId}/lessons/new`}>
            <Button>
              <Plus className="size-4 mr-1" />
              Add Lesson
            </Button>
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={lessons}
        loading={isLoading}
        emptyMessage="No lessons yet."
        emptyDescription="Add your first lesson to start building the curriculum."
      />
    </div>
  );
}
