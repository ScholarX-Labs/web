import { test, expect } from "@playwright/test";

test.describe("RTL Visual Snapshots", () => {
  test("home page matches visual snapshot in RTL", async ({ page }) => {
    await page.goto("/ar");
    // Wait for the page to finish loading completely
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-rtl.png", { 
      maxDiffPixelRatio: 0.2 
    });
  });
});
