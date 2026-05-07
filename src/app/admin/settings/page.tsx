"use client";

import { Card } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform</h3>
          <p className="text-sm text-gray-500">General platform settings coming soon.</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
          <p className="text-sm text-gray-500">Email configuration coming soon.</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payments</h3>
          <p className="text-sm text-gray-500">Payment gateway settings coming soon.</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
          <p className="text-sm text-gray-500">Security and access settings coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
