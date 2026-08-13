"use client";

import { useAdminTaskSubmissions } from "@/components/hooks/use-admin-task-submissions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskSubmissionsDataGridProps {
  courseId: string;
  lessonId: string;
  taskId: string;
}

export function TaskSubmissionsDataGrid({
  courseId,
  lessonId,
  taskId,
}: TaskSubmissionsDataGridProps) {
  const { submissions, isLoading, exportSubmissions } = useAdminTaskSubmissions(
    courseId,
    lessonId,
    taskId
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Task Submissions</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportSubmissions("csv")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportSubmissions("json")}>
              <FileJson className="mr-2 h-4 w-4" /> Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Points Awarded</TableHead>
              <TableHead>Submitted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              submissions.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium truncate max-w-[150px]">
                    {sub.userId}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        sub.status === "correct"
                          ? "bg-green-100 text-green-700"
                          : sub.status === "incorrect"
                          ? "bg-red-100 text-red-700"
                          : sub.status === "skipped"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell>{sub.pointsAwarded}</TableCell>
                  <TableCell>
                    {format(new Date(sub.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
