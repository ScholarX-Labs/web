import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  step: number;
  totalSteps?: number;
  onNext?: () => void;
  onBack?: () => void;
  isExpanded?: boolean;
  className?: string;
  hideButtons?: boolean;
}

const ProgressIndicator = ({
  step,
  totalSteps = 3,
  onNext,
  onBack,
  isExpanded = true,
  className,
  hideButtons = false
}: ProgressIndicatorProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-8", className)}>
      <div className="flex items-center gap-6 relative">
        {steps.map((dot) => (
          <div
            key={dot}
            className={cn(
              "w-2 h-2 rounded-full relative z-10 transition-colors duration-500",
              dot <= step ? "bg-white" : "bg-slate-300"
            )}
          />
        ))}

        {/* Green progress overlay */}
        <motion.div
          initial={false}
          animate={{
            width: `${(step / totalSteps) * 100}%`,
            minWidth: '24px',
            x: 0
          }}
          className="absolute -left-[8px] -top-[8px] -translate-y-1/2 h-3 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            mass: 0.8,
            bounce: 0.25,
            duration: 0.6
          }}
        />
      </div>

      {!hideButtons && (
        <div className="w-full max-w-sm">
          <motion.div
            className="flex items-center gap-2"
            animate={{
              justifyContent: isExpanded ? 'stretch' : 'space-between'
            }}
          >
            <AnimatePresence>
              {!isExpanded && (
                <motion.button
                  initial={{ opacity: 0, width: 0, scale: 0.8 }}
                  animate={{ opacity: 1, width: "auto", scale: 1 }}
                  exit={{ opacity: 0, width: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    mass: 0.8,
                    bounce: 0.25,
                    duration: 0.6,
                    opacity: { duration: 0.2 }
                  }}
                  onClick={onBack}
                  type="button"
                  className="px-6 py-3 text-slate-600 flex items-center justify-center bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all duration-200 flex-1 text-sm shadow-sm"
                >
                  Back
                </motion.button>
              )}
            </AnimatePresence>
            <motion.button
              onClick={onNext}
              layout
              type="button"
              className={cn(
                "px-6 py-3 rounded-2xl text-white font-bold bg-blue-600 shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all duration-200 flex-1",
                !isExpanded ? 'w-44' : 'w-full'
              )}
            >
              <div className="flex items-center justify-center gap-2 text-sm">
                {step === totalSteps && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      mass: 0.5,
                      bounce: 0.4
                    }}
                  >
                    <CircleCheck size={16} />
                  </motion.div>
                )}
                <span>{step === totalSteps ? 'Finish' : 'Continue'}</span>
              </div>
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProgressIndicator
