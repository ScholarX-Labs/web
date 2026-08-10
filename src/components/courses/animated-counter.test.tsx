import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./animated-counter";

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof globalThis.IntersectionObserver;
});

describe("AnimatedCounter", () => {
  it("renders correctly with initial value", () => {
    render(<AnimatedCounter value={1284} label="students enrolled" />);
    
    // Test for sr-only text
    expect(screen.getByText("1,284+ students enrolled")).toBeDefined();
    
    // Visible text (the span aria-hidden elements don't get combined by getByText, but we check if components render)
    expect(screen.getByText("students enrolled")).toBeDefined();
  });

  it("handles abbreviated prop", () => {
    render(<AnimatedCounter value={15000} label="students" abbreviated={true} />);
    expect(screen.getByText("15K+ students")).toBeDefined();
  });
  
  it("handles large abbreviated prop", () => {
    render(<AnimatedCounter value={150000} label="students" abbreviated={true} />);
    expect(screen.getByText("150K+ students")).toBeDefined();
  });

  it("handles different suffix", () => {
    render(<AnimatedCounter value={100} label="reviews" suffix="" />);
    expect(screen.getByText("100 reviews")).toBeDefined();
  });
});
