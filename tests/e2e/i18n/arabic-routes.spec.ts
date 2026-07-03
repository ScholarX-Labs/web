import { test, expect } from "@playwright/test";

test.describe("Arabic Routes", () => {
  test("renders arabic text and correct lang attributes", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar-EG");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("unsupported prefixes return 404", async ({ page }) => {
    const response = await page.goto("/fr/about");
    expect(response?.status()).toBe(404);
  });
});
