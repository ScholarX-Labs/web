/**
 * @file icon-cloud-demo.tsx
 * @description Demo showcase of the IconCloud component rendering an interactive 3D sphere of technology icons.
 *
 * @usage_guidelines
 * - Renders a Canvas-based interactive sphere using SVG icons.
 * - Utilizes Tailwind CSS v4.0 for alignment, size bounds, and background styling.
 *
 * @dark_mode_notes
 * - When designing portfolio websites with dark/light themes, integrate a "Fancy Dark Mode Toggle"
 *   to transition themes. This demo works seamlessly in both themes.
 */

import React from "react"
import { IconCloud } from "@/components/ui/icon-cloud"

export default function IconCloudDemo() {
  const icons = [
    // React SVG
    <svg key="react" viewBox="0 0 841.9 733.3" className="w-10 h-10 fill-sky-400">
      <path d="M666.3 296.5c-30.5-24.2-64.1-39.1-97.1-42.3 3.5-13 6.3-26.6 8.3-40.7 2.3-16 3-31.5 1.8-46-3.8-46.2-28.7-74.4-65.7-74.4-23.7 0-48.8 11.4-71.9 31.8-23 20.4-44.4 48.7-61.6 81.3-17.2-32.6-38.6-60.9-61.6-81.3-23.1-20.4-48.2-31.8-71.9-31.8-37 0-61.9 28.2-65.7 74.4-1.2 14.5-.5 30 1.8 46 2 14.1 4.8 27.7 8.3 40.7-33 3.2-66.6 18.1-97.1 42.3-39 31-60.1 72.3-60.1 113.5 0 41.2 21.1 82.5 60.1 113.5 30.5 24.2 64.1 39.1 97.1 42.3-3.5 13-6.3 26.6-8.3 40.7-2.3 16-3 31.5-1.8 46 3.8 46.2 28.7 74.4 65.7 74.4 23.7 0 48.8-11.4 71.9-31.8 23-20.4 44.4-48.7 61.6-81.3 17.2 31.8 38.6 59.9 61.6 81.3 23.1 20.4 48.2 31.8 71.9 31.8 37 0 61.9-28.2 65.7-74.4 1.2-14.5.5-30-1.8-46-2-14.1-4.8-27.7-8.3-40.7 33-3.2 66.6-18.1 97.1-42.3 39-31 60.1-72.3 60.1-113.5-.1-41.2-21.2-82.5-60.1-113.5zM524.2 124.9c22.7 0 37.2 16.8 39.7 47.7.8 10.3.3 21.9-1.4 34.6-2.1 15-5.3 30.7-9.6 46.9-22-2.3-44.8-6.1-68.2-11.4 9.1-23.7 20-45.7 32.3-65 17.6-27.6 35.8-32.8 47.2-32.8zM187.7 296.5c-24.9-19.8-39.7-47.5-39.7-74.5 0-11.4 5.2-29.6 22.8-47.2 19.3-19.3 42.9-25.1 54.3-25.1 11.4 0 29.6 5.2 47.2 22.8 23 23 37.1 56 46.5 90.9-23 2.1-46 5.3-68.2 9.6-14.9-16-33-30.7-46.9-46.9 16.2 4.3 31.9 7.5 46.9 9.6-4.3-16.2-7.5-31.9-9.6-46.9zm130 185.5c-9.4 34.9-23.5 67.9-46.5 90.9-17.6 17.6-35.8 22.8-47.2 22.8-11.4 0-35-5.8-54.3-25.1-17.6-17.6-22.8-35.8-22.8-47.2 0-27 14.8-54.7 39.7-74.5 13.9-16.2 32-30.9 46.9-46.9 2.1-15 5.3-30.7 9.6-46.9 22.2 4.3 45.2 7.5 68.2 9.6-9.1 34.9-23.2 67.9-46.5 90.9zm206.5 126.4c-11.4 0-29.6-5.2-47.2-22.8-12.3-19.3-23.2-41.3-32.3-65 23.4-5.3 46.2-9.1 68.2-11.4 4.3 16.2 7.5 31.9 9.6 46.9 1.7 12.7 2.2 24.3 1.4 34.6-2.5 30.9-17 47.7-39.7 47.7zm77.3-126.4c-23 2.1-46 5.3-68.2 9.6 14.9 16 33 30.7 46.9 46.9-16.2-4.3-31.9-7.5-46.9-9.6 4.3 16.2 7.5 31.9 9.6 46.9 24.9 19.8 39.7 47.5 39.7 74.5 0 11.4-5.2 29.6-22.8 47.2-19.3 19.3-42.9 25.1-54.3 25.1-11.4 0-29.6-5.2-47.2-22.8-23-23-37.1-56-46.5-90.9z" />
    </svg>,
    // TypeScript SVG
    <svg key="typescript" viewBox="0 0 100 100" className="w-10 h-10 fill-blue-600">
      <rect width="100" height="100" rx="10" />
      <text x="50" y="65" fill="white" fontSize="45" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" textAnchor="middle">TS</text>
    </svg>,
    // HTML5 SVG
    <svg key="html5" viewBox="0 0 512 512" className="w-10 h-10 fill-orange-500">
      <path d="M64 32l32 384 160 64 160-64 32-384H64zm320 128H200v48h176l-16 176-104 32-104-32-8-96h48l4 48 60 16 60-16 8-80H160v-48h220l4-48z" />
    </svg>,
    // CSS3 SVG
    <svg key="css3" viewBox="0 0 512 512" className="w-10 h-10 fill-blue-500">
      <path d="M64 32l32 384 160 64 160-64 32-384H64zm320 128H192v48h184l-16 176-104 32-104-32-8-96h48l4 48 60 16 60-16 8-80H160v-48h220l4-48z" />
    </svg>,
    // JavaScript SVG
    <svg key="javascript" viewBox="0 0 100 100" className="w-10 h-10 fill-yellow-500">
      <rect width="100" height="100" rx="10" />
      <text x="50" y="65" fill="black" fontSize="45" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" textAnchor="middle">JS</text>
    </svg>,
  ]

  return (
    <div className="relative flex h-[400px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border bg-background p-4 md:shadow-xl">
      <IconCloud icons={icons} />
    </div>
  )
}
