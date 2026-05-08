"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

const Component = () => {
  const [checked, setChecked] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-[200px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        <div
          className={cn(
            "relative w-24 h-72 rounded-full transition-all duration-500",
            "bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700",
            "shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(255,255,255,0.1)]",
          )}
        >
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full transition-all duration-500",
              "bg-gradient-to-br from-yellow-400 to-yellow-600",
              "shadow-[0_4px_15px_rgba(234,179,8,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)]",
              "border-2 border-yellow-300/50",
              checked ? "top-3" : "top-[calc(100%-4.5rem)]",
            )}
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-50" />
          </div>
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-1 h-20 rounded-full transition-all duration-500",
              "bg-gradient-to-b from-slate-500 to-slate-600",
              checked ? "top-20" : "top-8",
            )}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-slate-500/30 rounded-full" />
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider transition-all duration-500",
              checked ? "top-[4.75rem] text-yellow-400" : "bottom-4 text-slate-500",
            )}
          >
            {checked ? "ON" : "OFF"}
          </div>
        </div>
      </label>
    </div>
  )
}

export { Component }
