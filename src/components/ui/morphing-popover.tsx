"use client";

import {
  useState,
  useId,
  useRef,
  useEffect,
  createContext,
  useContext,
  isValidElement,
  forwardRef,
  startTransition,
} from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/static-components */

type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  uniqueId: string;
  variants?: Variants;
};

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(
  null
);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  };

  const close = () => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  };

  return { isOpen, open, close, uniqueId };
}

export type MorphingPopoverProps = {
  children: React.ReactNode;
  transition?: Transition;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: Variants;
  className?: string;
} & React.ComponentProps<"div">;

function MorphingPopover({
  children,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className,
  ...props
}: MorphingPopoverProps) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <div 
        className={cn(
          "relative w-fit h-fit", 
          popoverLogic.isOpen && "z-50", 
          className
        )} 
        {...props}
      >
        {children}
      </div>
    </MorphingPopoverContext.Provider>
  );
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<"button">;

const MorphingPopoverTrigger = forwardRef<
  HTMLButtonElement,
  MorphingPopoverTriggerProps
>(({ children, className, asChild = false, ...props }, ref) => {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error(
      "MorphingPopoverTrigger must be used within MorphingPopover"
    );
  }

  if (asChild && isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    const MotionComponent = motion.create(
      children.type as React.ForwardRefExoticComponent<any>
    );

    return (
      <MotionComponent
        ref={ref}
        {...childProps}
        onClick={(e: any) => {
          (childProps.onClick as ((e: any) => void) | undefined)?.(e);
          context.open();
        }}
        layoutId={`popover-trigger-${context.uniqueId}`}
        key={`popover-trigger-${context.uniqueId}`}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      />
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      layoutId={`popover-trigger-${context.uniqueId}`}
      key={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
      className={cn(className)}
      aria-expanded={context.isOpen}
      aria-controls={`popover-content-${context.uniqueId}`}
      {...(props as Record<string, unknown>)}
    >
      <motion.span layoutId={`popover-label-${context.uniqueId}`}>
        {children}
      </motion.span>
    </motion.button>
  );
});
MorphingPopoverTrigger.displayName = "MorphingPopoverTrigger";

export type MorphingPopoverContentProps = {
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<"div">;

function MorphingPopoverContent({
  children,
  className,
  ...props
}: MorphingPopoverContentProps) {
  const context = useContext(MorphingPopoverContext);
  if (!context)
    throw new Error(
      "MorphingPopoverContent must be used within MorphingPopover"
    );

  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useClickOutside(ref, () => context.close());

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
    if (!context.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") context.close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [context, context.isOpen, context.close]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {context.isOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
          <div className="pointer-events-auto relative">
             <motion.div
                ref={ref}
                id={`popover-content-${context.uniqueId}`}
                layoutId={`popover-trigger-${context.uniqueId}`}
                className={cn(
                "overflow-hidden bg-white shadow-[0_30px_90px_-15px_rgba(0,0,0,0.3)] border border-slate-200 rounded-3xl",
                className
                )}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={context.variants}
                {...(props as Record<string, unknown>)}
            >
                {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
