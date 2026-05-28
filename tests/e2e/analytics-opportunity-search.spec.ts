import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("ai-search smoke emits search and opportunity apply analytics events", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run analytics opportunity/search e2e coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const mirroredEvents: string[] = [];

    await page.route("**/api/analytics/events", async (route) => {
      const body = route.request().postDataJSON() as { event?: string } | null;
      if (body?.event) mirroredEvents.push(body.event);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route("https://scholarx-search-api.vercel.app/api/search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "mock-opportunity-1",
              score: 0.96,
              opportunity: {
                id: "mock-opportunity-1",
                title: "Mock AI Opportunity",
                description: "Mock description",
                country: ["US"],
                deadline: "2026-12-31",
                fund_type: ["fully_funded"],
                is_remote: true,
                application_link: "https://example.com/apply",
                type: { subtype: ["scholarship"] },
              },
            },
          ],
        }),
      });
    });

    await page.goto(`${baseUrl}/ai-search`);
    if (page.url().includes("/auth/")) {
      t.skip("AI search route requires authenticated session in this environment.");
      return;
    }

    const prompt = page.getByPlaceholder("Ask about scholarships, internships, fellowships...");
    await prompt.fill("scholarships in computer science");
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByRole("button", { name: "Apply Now" }).first().click();

    await page.waitForTimeout(250);

    assert.equal(mirroredEvents.includes("ai_search"), true);
    assert.equal(mirroredEvents.includes("opportunity_apply_click"), true);
  } finally {
    await browser.close();
  }
});
