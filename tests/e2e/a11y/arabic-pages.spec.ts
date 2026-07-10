import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Arabic Accessibility", () => {
  test("home page in Arabic should not have automatically detectable a11y issues", async ({ page }) => {
    await page.goto("/ar");
    await page.waitForLoadState("networkidle");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
