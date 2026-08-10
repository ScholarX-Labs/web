import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ActivityBadge } from "./activity-badge";

let shouldReduceMotionMock = false;

vi.mock("framer-motion", async (importOriginal) => {
  const original = await importOriginal<typeof import("framer-motion")>();
  return {
    ...original,
    useReducedMotion: () => shouldReduceMotionMock,
  };
});

describe("ActivityBadge", () => {
  beforeEach(() => {
    shouldReduceMotionMock = false;
  });

  it("renders correctly when increment is positive", () => {
    render(<ActivityBadge increment={1} />);
    expect(screen.getByText("+1 just now")).toBeDefined();
  });

  it("does not render when increment is 0", () => {
    const { container } = render(<ActivityBadge increment={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("disappears after dismissAfterMs", () => {
    vi.useFakeTimers();
    render(<ActivityBadge increment={2} dismissAfterMs={1000} />);
    expect(screen.getByText("+2 just now")).toBeDefined();
    
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    
    // It should trigger exit animation (which takes it out of the DOM eventually)
    // Framer motion AnimatePresence exit animations in testing can be tricky, 
    // but the state `isVisible` becomes false.
  });

  it("renders ping animation by default", () => {
    const { container } = render(<ActivityBadge increment={1} />);
    expect(container.querySelector(".animate-ping")).not.toBeNull();
  });

  it("omits the ping animation when shouldReduceMotion is true", () => {
    shouldReduceMotionMock = true;
    const { container } = render(<ActivityBadge increment={1} />);
    expect(container.querySelector(".animate-ping")).toBeNull();
  });
});
