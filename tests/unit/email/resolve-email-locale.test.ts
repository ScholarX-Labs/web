import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Define the global database mock instance before importing resolveEmailLocale
const mockQueryResults = { locale: "ar" };
const mockDbInstance = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([mockQueryResults]),
      }),
    }),
  }),
};
(globalThis as any).__MOCK_DB__ = mockDbInstance;

import { resolveEmailLocale } from "../../../src/lib/email/send";

describe("Email locale resolution", () => {
  beforeEach(() => {
    mockQueryResults.locale = "en";
  });

  test("resolves from userId database preference", async () => {
    mockQueryResults.locale = "ar";
    const locale = await resolveEmailLocale({ userId: "user-1" });
    assert.equal(locale, "ar");
  });

  test("resolves from email database preference", async () => {
    mockQueryResults.locale = "ar";
    const locale = await resolveEmailLocale({ email: "user@example.com" });
    assert.equal(locale, "ar");
  });

  test("resolves from journeyLocale if not in database", async () => {
    mockQueryResults.locale = ""; // empty result
    const locale = await resolveEmailLocale({ journeyLocale: "ar" });
    assert.equal(locale, "ar");
  });

  test("falls back to default locale if no preference or journey locale is found", async () => {
    mockQueryResults.locale = "";
    const locale = await resolveEmailLocale({});
    assert.equal(locale, "en");
  });
});
