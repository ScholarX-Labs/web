"use client";

import { Loader2, Save, RotateCcw } from "lucide-react";
import { AnimatePresence, easeOut, motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import React from "react";

const UnsavePopupDescription = memo(
  ({ children }: { children: React.ReactNode }) => {
    return <div className="flex flex-row items-center gap-2 text-slate-600 font-medium">{children}</div>;
  }
);
UnsavePopupDescription.displayName = "UnsavePopupDescription";

const UnsavePopupAction = memo(
  ({
    children,
    isLoading,
    onClick,
  }: {
    children: React.ReactNode;
    isLoading?: boolean;
    onClick?: () => Promise<void>;
  }) => {
    return (
      <Button 
        onClick={async () => { try { await onClick?.(); } catch (e) { console.error(e); } }} 
        disabled={isLoading} 
        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }
);
UnsavePopupAction.displayName = "UnsavePopupAction";

const UnsavePopupDismiss = memo(
  ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    return (
      <Button 
        variant="ghost" 
        onClick={onClick} 
        className="rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold transition-all"
      >
        {children}
      </Button>
    );
  }
);
UnsavePopupDismiss.displayName = "UnsavePopupDismiss";

// Main component
const UnsavePopup = memo(function UnsavePopup({
  children,
  onSave,
  onReset,
  shouldBlockFn,
  show,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  onSave?: () => Promise<void>;
  onReset?: () => void;
  shouldBlockFn?: () => boolean;
  show: boolean;
}) {
  const controls = useAnimation();
  const [isLoading, setIsLoading] = useState(false);

  const shakeAnimation = useCallback(
    () => ({
      x: [0, -8, 12, -15, 8, -10, 5, -3, 2, -1, 0],
      y: [0, 4, -9, 6, -12, 8, -3, 5, -2, 1, 0],
      filter: [
        "blur(0px)",
        "blur(2px)",
        "blur(2px)",
        "blur(3px)",
        "blur(2px)",
        "blur(2px)",
        "blur(1px)",
        "blur(2px)",
        "blur(1px)",
        "blur(1px)",
        "blur(0px)",
      ],
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    }),
    []
  );

  const triggerShake = useCallback(async () => {
    await controls.start(shakeAnimation());
  }, [controls, shakeAnimation]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    await onSave?.();
    setIsLoading(false);
  }, [onSave]);

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  const { hasCompoundComponents, hasValidComponents } = useMemo(() => {
    const childrenArray = React.Children.toArray(children);
    const hasCompound = childrenArray.some(
      (child) =>
        React.isValidElement(child) &&
        (child.type === UnsavePopupDescription ||
          child.type === UnsavePopupAction ||
          child.type === UnsavePopupDismiss)
    );

    if (!hasCompound) {
      return { hasCompoundComponents: false, hasValidComponents: true };
    }

    const hasDescription = childrenArray.some(
      (child) =>
        React.isValidElement(child) && child.type === UnsavePopupDescription
    );
    const hasAction = childrenArray.some(
      (child) => React.isValidElement(child) && child.type === UnsavePopupAction
    );
    const hasDismiss = childrenArray.some(
      (child) =>
        React.isValidElement(child) && child.type === UnsavePopupDismiss
    );

    return {
      hasCompoundComponents: true,
      hasValidComponents: hasDescription && hasAction && hasDismiss,
    };
  }, [children]);

  useEffect(() => {
    if (hasCompoundComponents && !hasValidComponents) {
      console.error(
        "When using UnsavePopupDescription, UnsavePopupAction, or UnsavePopupDismiss, you must use all three components together."
      );
    }
  }, [hasCompoundComponents, hasValidComponents]);

  const defaultButtons = useCallback(
    () => (
      <div className="flex flex-row items-center gap-2">
        <Button variant="ghost" onClick={handleReset} className="rounded-xl font-bold text-slate-500 hover:text-slate-900 transition-all">
          <RotateCcw className="size-3.5 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </span>
          )}
        </Button>
      </div>
    ),
    [isLoading, handleReset, handleSave]
  );

  useEffect(() => {
    if (shouldBlockFn && shouldBlockFn()) {
      triggerShake();
    }
  }, [shouldBlockFn, triggerShake]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className="fixed right-0 bottom-8 left-0 z-50 mx-auto w-fit"
        >
          <motion.div
            animate={controls}
            className={cn(
              "flex flex-row items-center justify-between gap-8 rounded-2xl",
              "border border-slate-200 bg-white/80 backdrop-blur-xl px-5 py-3 shadow-2xl shadow-slate-200/50",
              className
            )}
          >
            {hasCompoundComponents ? (
              children
            ) : (
              <>
                <div className="flex flex-row items-center gap-3 text-slate-900 font-bold text-sm tracking-tight">
                  <div className="size-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Save className="size-4" />
                  </div>
                  {children}
                </div>
                {defaultButtons()}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

UnsavePopup.displayName = "UnsavePopup";

export {
  UnsavePopup,
  UnsavePopupDescription,
  UnsavePopupAction,
  UnsavePopupDismiss,
};
