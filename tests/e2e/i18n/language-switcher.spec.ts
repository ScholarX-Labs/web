import { test, expect } from "@playwright/test";

test.describe("Language Switcher Journey", () => {
  test("switches language correctly and persists selection", async ({ page }) => {
    // Visit home page (default English)
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");

    // Locate and click the Arabic language switcher option
    // It should have lang="ar-EG" or aria-label referencing Arabic/العربية
    const arButton = page.locator('button[lang="ar-EG"]');
    await expect(arButton).toBeVisible();
    await arButton.click();

    // Verify redirection to Arabic path
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar-EG");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Click English language switcher option to return
    const enButton = page.locator('button[lang="en-US"]');
    await expect(enButton).toBeVisible();
    await enButton.click();

    // Verify redirection back to English route
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
