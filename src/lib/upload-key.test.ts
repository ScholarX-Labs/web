import test from "node:test";
import assert from "node:assert/strict";

process.env.R2_PUBLIC_URL = "https://cdn.example.com";

test("getAvatarKeyFromUrl", async (t) => {
  const { getAvatarKeyFromUrl } = await import("@/lib/upload");

  await t.test("extracts key from matching URL", () => {
    const url = "https://cdn.example.com/avatars/user-1/uuid.jpg";
    const key = getAvatarKeyFromUrl(url);
    assert.equal(key, "avatars/user-1/uuid.jpg");
  });

  await t.test("returns null for non-matching URL", () => {
    const url = "https://other-cdn.com/avatars/user-1/uuid.jpg";
    const key = getAvatarKeyFromUrl(url);
    assert.equal(key, null);
  });

  await t.test("returns null for empty string", () => {
    const key = getAvatarKeyFromUrl("");
    assert.equal(key, null);
  });

  await t.test("returns null when URL is just the prefix with nothing after", () => {
    const url = "https://cdn.example.com/";
    const key = getAvatarKeyFromUrl(url);
    assert.equal(key, "");
  });
});
