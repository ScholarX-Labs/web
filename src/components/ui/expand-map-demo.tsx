"use client"

import { LocationMap } from "@/components/ui/expand-map"

function ExpandMapDemo() {
  return (
    <main className="min-h-screen flex items-center justify-center w-full">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.03)_0%,_transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <p className="text-neutral-600 text-xs font-medium tracking-[0.2em] uppercase">Current Location</p>
        <LocationMap location="San Francisco, CA" coordinates="37.7749° N, 122.4194° W" />
      </div>
    </main>
  )
}

export { ExpandMapDemo }
