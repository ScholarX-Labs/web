import { describe, test, expect } from "vitest";
import { getLocalizedRoute } from "@/lib/i18n/route-inventory";

describe("Localized route middleware integration", () => {
  test("returns original path for default locale", () => {
    expect(getLocalizedRoute("en", "/about")).toBe("/about");
    expect(getLocalizedRoute("en", "/")).toBe("/");
  });

  test("returns prefixed path for arabic locale", () => {
    expect(getLocalizedRoute("ar", "/about")).toBe("/ar/about");
    expect(getLocalizedRoute("ar", "/")).toBe("/ar");
  });
});
