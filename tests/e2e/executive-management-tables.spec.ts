import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive users and courses pages render management oversight tables", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive management table browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    await page.goto(`${baseUrl}/admin/executive/users?from=2026-05-01&to=2026-05-25`);
    await page.getByRole("heading", { name: "User management oversight" }).waitFor();
    assert.equal(await page.getByText("User management oversight").isVisible(), true);

    await page.goto(`${baseUrl}/admin/executive/courses-lessons?from=2026-05-01&to=2026-05-25`);
    await page.getByRole("heading", { name: "Course management oversight" }).waitFor();
    assert.equal(await page.getByText("Course management oversight").isVisible(), true);
  } finally {
    await browser.close();
  }
});
