import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioHapticController } from './AudioHapticController';
import { UserLoaderPreferences } from './types';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

interface BubblePopGameProps {
  preferences: UserLoaderPreferences;
  onPop: () => void;
}

const COLORS = [
  'bg-indigo-400', 'bg-blue-400', 'bg-purple-400', 'bg-emerald-400', 'bg-rose-400'
];

export function BubblePopGame({ preferences, onPop }: BubblePopGameProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleIdCounter = useRef(0);

  useEffect(() => {
    if (!preferences.gameModeEnabled) return;
    
    // Spawn bubbles periodically
    const spawnInterval = setInterval(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      
      const newBubble: Bubble = {
        id: bubbleIdCounter.current++,
        x: Math.random() * (width - 60) + 30, // 30px padding
        y: height + 60, // Start below container
        size: Math.random() * 40 + 30, // 30-70px
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: Math.random() * 2 + 1, // 1-3 px per frame
      };
      
      setBubbles(prev => [...prev.slice(-15), newBubble]); // Keep max 15 bubbles
    }, 800);
    
    return () => clearInterval(spawnInterval);
  }, [preferences.gameModeEnabled]);

  const handlePop = (id: number) => {
    audioHapticController.playPopSound(preferences);
    audioHapticController.triggerPopHaptic(preferences);
    onPop();
    setBubbles(prev => prev.filter(b => b.id !== id));
  };

  if (!preferences.gameModeEnabled || preferences.simplifiedAnimations) {
    return null; // Don't render if disabled or reduced motion
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    >
      <AnimatePresence>
        {bubbles.map(bubble => (
          <motion.button
            key={bubble.id}
            initial={{ opacity: 0, y: bubble.y, x: bubble.x, scale: 0 }}
            animate={{ 
              opacity: 0.8, 
              y: -100, // Move up off screen
              x: bubble.x + (Math.sin(bubble.id) * 50), // Wobbly path
              scale: 1 
            }}
            exit={{ opacity: 0, scale: 1.5 }} // Pop effect
            transition={{ 
              y: { duration: 8 / bubble.speed, ease: 'linear' },
              x: { duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
              opacity: { duration: 0.3 },
              scale: { duration: 0.4, type: 'spring' }
            }}
            onClick={() => handlePop(bubble.id)}
            className={`absolute pointer-events-auto rounded-full ${bubble.color} shadow-lg cursor-crosshair border border-white/30 backdrop-blur-sm`}
            style={{ 
              width: bubble.size, 
              height: bubble.size,
              touchAction: 'none'
            }}
            aria-label="Pop bubble"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
