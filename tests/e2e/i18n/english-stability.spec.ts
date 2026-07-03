import { test, expect } from "@playwright/test";

test.describe("English Stability", () => {
  test("renders english page by default without prefix redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    expect(page.url()).not.toContain("/en");
  });

  test("renders unprefixed english routes properly", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    expect(page.url()).not.toContain("/en/about");
  });
});
