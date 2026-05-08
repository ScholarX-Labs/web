"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAdminCourse, useUpdateCourse, useUpdateCourseStatus } from "@/hooks/admin/use-admin-courses";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "basic", label: "Basic" },
  { id: "pricing", label: "Pricing" },
  { id: "settings", label: "Settings" },
  { id: "content", label: "Content" },
  { id: "media", label: "Media" },
];

export default function AdminCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: course, isLoading } = useAdminCourse(courseId);
  const updateCourse = useUpdateCourse();
  const updateStatus = useUpdateCourseStatus();
  const [activeTab, setActiveTab] = useState("basic");
  const c = course as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold">Course not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The course you are looking for does not exist.</p>
        <Link href="/admin/courses">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-3 mr-1" />
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      await updateCourse.mutateAsync({ id: courseId, data });
      toast.success("Course updated");
    } catch {
      toast.error("Failed to update course");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id: courseId, data: { status } });
      toast.success(`Course status changed to ${statusLabel(status).toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Courses
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {String(c.title ?? "Untitled Course")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {String(c.category ?? "") || "Uncategorized"}
            </p>
          </div>
          <Badge
            variant={
              String(c.status ?? "") === "active"
                ? "default"
                : String(c.status ?? "") === "draft"
                  ? "secondary"
                  : "outline"
            }
            className="shrink-0"
          >
            {statusLabel(String(c.status ?? ""))}
          </Badge>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === "basic" && <BasicTab course={c} onSave={handleSave} />}
          {activeTab === "pricing" && <PricingTab course={c} onSave={handleSave} />}
          {activeTab === "settings" && (
            <SettingsTab course={c} onStatusChange={handleStatusChange} />
          )}
          {activeTab === "content" && <ContentTab courseId={courseId} />}
          {activeTab === "media" && <MediaTab />}
        </div>

        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  Course Thumbnail
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate">{String(c.title ?? "")}</p>
                  <p className="text-xs text-muted-foreground">{String(c.category ?? "") || "Uncategorized"}</p>
                  {c.price != null && (
                    <p className="text-sm font-bold">${Number(c.price).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href={`/admin/courses/${courseId}/lessons`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                Manage Lessons
              </Link>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(c.id ?? "").slice(0, 12)}...</code></p>
              <p>Created: {formatDate(c.createdAt as string)}</p>
              <p>Updated: {formatDate(c.updatedAt as string)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BasicTab({
  course,
  onSave,
}: {
  course: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(String(course.title ?? ""));
  const [description, setDescription] = useState(String(course.description ?? ""));
  const [category, setCategory] = useState(String(course.category ?? ""));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <Button onClick={() => onSave({ title, description, category: category || undefined })}>
          <Save className="size-3 mr-1" />
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

function PricingTab({
  course,
  onSave,
}: {
  course: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [price, setPrice] = useState(String(course.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(
    String((course as Record<string, unknown>).discountPrice ?? ""),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Price ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Discount Price ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button
          onClick={() =>
            onSave({
              price: price ? Number(price) : undefined,
              discountPrice: discountPrice ? Number(discountPrice) : undefined,
            })
          }
        >
          <Save className="size-3 mr-1" />
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsTab({
  course,
  onStatusChange,
}: {
  course: Record<string, unknown>;
  onStatusChange: (status: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Status</label>
          <div className="flex gap-2 flex-wrap">
            {["active", "inactive", "draft", "archived"].map((s) => (
              <Button
                key={s}
                variant={course.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(s)}
                className="min-w-[80px]"
              >
                {statusLabel(s)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentTab({ courseId }: { courseId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your course lessons in the lessons section.
        </p>
        <Link href={`/admin/courses/${courseId}/lessons`}>
          <Button variant="outline">
            <BookOpen className="size-3 mr-1" />
            Manage Lessons
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function MediaTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-8">
          Media management coming soon. You will be able to upload thumbnails, videos, and other course assets here.
        </p>
      </CardContent>
    </Card>
  );
}
