import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive courses page renders content quality checklist", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive content quality browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/courses-lessons?from=2026-05-01&to=2026-05-25&courseId=course-1`);

    await page.getByRole("heading", { name: "Courses and lessons" }).waitFor();
    await page.getByRole("heading", { name: "Content quality checklist" }).waitFor();

    assert.equal(await page.getByText("Content quality checklist").isVisible(), true);
    assert.equal(await page.getByText("Course leaderboard").isVisible(), true);
  } finally {
    await browser.close();
  }
});
