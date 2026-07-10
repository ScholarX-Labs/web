import test from "node:test";
import assert from "node:assert/strict";

// Provide a minimal Azure-style connection string so env validation passes
// and so getAvatarKeyFromUrl can be imported without throwing.
process.env.AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=devaccount;AccountKey=ZmFrZWtleQ==;EndpointSuffix=core.windows.net";

test("getAvatarKeyFromUrl", async (t) => {
  const { getAvatarKeyFromUrl } = await import("@/lib/upload");

  await t.test("extracts blob name from Azure Blob URL", () => {
    const url =
      "https://devaccount.blob.core.windows.net/avatars/user-1/uuid.jpg";
    const key = getAvatarKeyFromUrl(url);
    assert.equal(key, "user-1/uuid.jpg");
  });

  await t.test("returns null for invalid URL", () => {
    const key = getAvatarKeyFromUrl("not-a-url");
    assert.equal(key, null);
  });

  await t.test("returns null for empty string", () => {
    const key = getAvatarKeyFromUrl("");
    assert.equal(key, null);
  });

  await t.test("returns null when there is no blob name after the container", () => {
    const url = "https://devaccount.blob.core.windows.net/avatars";
    const key = getAvatarKeyFromUrl(url);
    assert.equal(key, null);
  });
});
