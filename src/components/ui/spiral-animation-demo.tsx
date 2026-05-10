'use client'

/** @usage Full-screen hero intro, landing page splash, portfolio entry */
import { useState, useEffect } from 'react'
import { SpiralAnimation } from '@/components/ui/spiral-animation'

export function SpiralDemo() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <SpiralAnimation />
      </div>
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-[1500ms] ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <button className="text-white text-2xl tracking-[0.2em] uppercase font-extralight transition-all duration-700 hover:tracking-[0.3em] animate-pulse">
          Enter
        </button>
      </div>
    </div>
  )
}
