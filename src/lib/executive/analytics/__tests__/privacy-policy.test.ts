import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAnalyticsProperties } from "../privacy";

test("privacy policy removes sensitive keys and keeps allowed fields", () => {
  const output = sanitizeAnalyticsProperties({
    source: "web",
    password: "secret",
    refreshToken: "token-value",
    cta_id: "hero_signup",
  });

  assert.equal(output.source, "web");
  assert.equal(output.cta_id, "hero_signup");
  assert.equal("password" in output, false);
  assert.equal("refreshToken" in output, false);
});

