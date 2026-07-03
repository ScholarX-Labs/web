"use client";

import React, { useState } from "react";
import MacOSDock from "@/components/ui/mac-os-dock";

const sampleApps = [
  {
    id: 'finder',
    name: 'Finder',
    icon: 'https://cdn.jim-nielsen.com/macos/1024/finder-2020-07-29.png?rf=1024'
  },
  {
    id: 'safari',
    name: 'Safari',
    icon: 'https://cdn.jim-nielsen.com/macos/1024/safari-2020-07-30.png?rf=1024'
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'https://cdn.jim-nielsen.com/macos/1024/messages-2020-08-01.png?rf=1024'
  },
  {
    id: 'mail',
    name: 'Mail',
    icon: 'https://cdn.jim-nielsen.com/macos/1024/mail-2020-08-01.png?rf=1024'
  },
  {
    id: 'calendar',
    name: 'Calendar', 
    icon: 'https://cdn.jim-nielsen.com/macos/1024/calendar-2021-04-29.png?rf=1024' 
  },
];

export default function DockDemo() {
  const [openApps, setOpenApps] = useState<string[]>(['finder', 'safari']);

  const handleAppClick = (appId: string) => {
    console.log('App clicked:', appId);
    setOpenApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  return (
    <div className="w-full h-[400px] flex items-end justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 relative pb-12 shadow-inner">
      {/* Background wallpaper effect to mimic macOS desktop */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 dark:opacity-20 mix-blend-overlay"></div>
      
      <div className="relative z-10 w-full flex justify-center">
        <MacOSDock
          apps={sampleApps}
          onAppClick={handleAppClick}
          openApps={openApps}
        />
      </div>
    </div>
  );
}
