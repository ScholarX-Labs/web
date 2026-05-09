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
} from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/static-components */

const TRANSITION: Transition = {
  type: "spring",
  bounce: 0.1,
  duration: 0.4,
};

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
      <div className={cn("relative w-fit h-fit", className)} {...props}>
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
>(({ children, className, asChild = false, ...props }, _ref) => {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error(
      "MorphingPopoverTrigger must be used within MorphingPopover"
    );
  }

  if (asChild && isValidElement(children)) {
    const MotionComponent = motion.create(
      children.type as React.ForwardRefExoticComponent<any>
    );

    return (
      <MotionComponent
        {...children.props}
        onClick={(e: any) => {
          children.props.onClick?.(e);
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
      layoutId={`popover-trigger-${context.uniqueId}`}
      key={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
      className={cn(className)}
      aria-expanded={context.isOpen}
      aria-controls={`popover-content-${context.uniqueId}`}
      {...props}
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
  useClickOutside(ref, () => context.close());

  useEffect(() => {
    if (!context.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") context.close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [context.isOpen, context.close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <div className="absolute top-0 left-0 z-50">
          <motion.div
            ref={ref}
            layoutId={`popover-trigger-${context.uniqueId}`}
            className={cn(
              "overflow-hidden bg-white shadow-2xl border border-slate-200 rounded-2xl",
              className
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={context.variants}
            {...props}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };
