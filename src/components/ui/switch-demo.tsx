"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export function SwitchDemo() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="flex flex-col gap-6 p-8 bg-black rounded-xl w-full max-w-md">
      <h2 className="text-lg font-semibold text-white">Settings</h2>
      <Switch
        checked={notifications}
        onCheckedChange={setNotifications}
        label="Push Notifications"
        id="notifications"
      />
      <Switch
        checked={darkMode}
        onCheckedChange={setDarkMode}
        label="Dark Mode"
        id="dark-mode"
      />
      <Switch
        checked={autoSave}
        onCheckedChange={setAutoSave}
        label="Auto Save"
        id="auto-save"
        size="sm"
      />
      <Switch
        checked={false}
        onCheckedChange={() => {}}
        label="Disabled"
        id="disabled"
        disabled
      />
    </div>
  );
}
