"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAdminCourse, useUpdateCourse, useUpdateCourseStatus } from "@/hooks/admin/use-admin-courses";
import { formatDate, statusColor, statusLabel } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TABS = [
  { id: "basic", label: "Basic" },
  { id: "content", label: "Content" },
  { id: "pricing", label: "Pricing" },
  { id: "media", label: "Media" },
  { id: "settings", label: "Settings" },
];

export default function AdminCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: course, isLoading } = useAdminCourse(courseId);
  const updateCourse = useUpdateCourse();
  const updateStatus = useUpdateCourseStatus();
  const [activeTab, setActiveTab] = useState("basic");
  const c = course as Record<string, unknown> | undefined;

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>;
  if (!c) return <p className="text-red-500">Course not found.</p>;

  const handleSave = async (data: Record<string, unknown>) => {
    try { await updateCourse.mutateAsync({ id: courseId, data }); } catch { /* handled */ }
  };

  const handleStatusChange = async (status: string) => {
    try { await updateStatus.mutateAsync({ id: courseId, data: { status } }); } catch { /* handled */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/courses" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Courses</Link>
          <h2 className="text-2xl font-bold text-gray-900">{String(c.title ?? "Untitled Course")}</h2>
        </div>
        <Badge variant={(statusColor(String(c.status ?? "")) === "green" ? "default" : "secondary") as "default" | "secondary" | "destructive" | "outline"}>
          {statusLabel(String(c.status ?? ""))}
        </Badge>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            {activeTab === "basic" && <BasicTab course={c} onSave={handleSave} />}
            {activeTab === "pricing" && <PricingTab course={c} onSave={handleSave} />}
            {activeTab === "settings" && <SettingsTab course={c} onStatusChange={handleStatusChange} />}
            {activeTab === "content" && <p className="text-gray-500">Lesson management available in the lessons section.</p>}
            {activeTab === "media" && <p className="text-gray-500">Media management coming soon.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="aspect-video bg-gray-100 rounded-md mb-2 flex items-center justify-center text-gray-400 text-xs">Thumbnail</div>
              <p className="text-sm font-medium text-gray-900 truncate">{String(c.title ?? "")}</p>
              <p className="text-xs text-gray-500 mt-1">{String(c.category ?? "")}</p>
              {c.price && <p className="text-sm font-bold text-gray-900 mt-1">${Number(c.price).toFixed(2)}</p>}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Links</h4>
            <div className="space-y-1">
              <Link href={`/admin/courses/${courseId}/lessons`} className="block text-sm text-blue-600 hover:text-blue-700">Manage Lessons</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BasicTab({ course, onSave }: { course: Record<string, unknown>; onSave: (data: Record<string, unknown>) => void }) {
  const [title, setTitle] = useState(String(course.title ?? ""));
  const [description, setDescription] = useState(String(course.description ?? ""));
  const [category, setCategory] = useState(String(course.category ?? ""));
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[120px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <Button onClick={() => onSave({ title, description, category: category || undefined })}>Save</Button>
    </div>
  );
}

function PricingTab({ course, onSave }: { course: Record<string, unknown>; onSave: (data: Record<string, unknown>) => void }) {
  const [price, setPrice] = useState(String(course.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(String((course as Record<string, unknown>).discountPrice ?? ""));
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
        <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price ($)</label>
        <Input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
      </div>
      <Button onClick={() => onSave({ price: price ? Number(price) : undefined, discountPrice: discountPrice ? Number(discountPrice) : undefined })}>Save</Button>
    </div>
  );
}

function SettingsTab({ course, onStatusChange }: { course: Record<string, unknown>; onStatusChange: (status: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <div className="flex gap-2">
          {["active", "inactive", "draft"].map((s) => (
            <Button key={s} variant={course.status === s ? "default" : "outline"} size="sm" onClick={() => onStatusChange(s)}>
              {statusLabel(s)}
            </Button>
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200 text-sm text-gray-500 space-y-1">
        <p>ID: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{String(course.id ?? "")}</code></p>
        <p>Created: {formatDate(course.createdAt as string)}</p>
        <p>Updated: {formatDate(course.updatedAt as string)}</p>
      </div>
    </div>
  );
}
