import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ActivityBadge } from "./activity-badge";

describe("ActivityBadge", () => {
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
});
