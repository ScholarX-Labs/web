export const dynamic = "force-dynamic";
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Mail, CreditCard, Shield } from "lucide-react";

const settingsSections = [
  {
    title: "Platform",
    description: "General platform settings",
    icon: Settings,
    color: "text-blue-600 bg-blue-100",
  },
  {
    title: "Email",
    description: "Email configuration and templates",
    icon: Mail,
    color: "text-amber-600 bg-amber-100",
  },
  {
    title: "Payments",
    description: "Payment gateway and pricing",
    icon: CreditCard,
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    title: "Security",
    description: "Security and access control",
    icon: Shield,
    color: "text-red-600 bg-red-100",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your platform</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${section.color}`}
                >
                  <section.icon className="size-5" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Coming soon</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {section.title} settings will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
