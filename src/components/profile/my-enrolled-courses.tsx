"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export function MyEnrolledCourses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
        <CardDescription>Track your enrolled courses and learning progress.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">No enrolled courses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse our catalog and start learning today.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.COURSES}>Browse Courses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
