import { expect, test, describe } from "vitest";
import { isLocale, getDir, isRTL, SUPPORTED_LOCALES } from "@/lib/i18n/locales";

describe("i18n locales", () => {
  test("SUPPORTED_LOCALES includes en and ar", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("ar");
  });
  
  test("isLocale returns true for supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
  });
  
  test("isLocale returns false for unsupported locales", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("es")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
  
  test("getDir returns correct direction", () => {
    expect(getDir("en")).toBe("ltr");
    expect(getDir("ar")).toBe("rtl");
  });
  
  test("isRTL returns correct boolean", () => {
    expect(isRTL("en")).toBe(false);
    expect(isRTL("ar")).toBe(true);
  });
});
