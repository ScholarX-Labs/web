import test from "node:test";
import assert from "node:assert/strict";

test("detectMagicBytes", async (t) => {
  const { detectMagicBytes } = await import("@/lib/upload");

  await t.test("detects JPEG magic bytes", () => {
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    assert.equal(detectMagicBytes(buffer), "image/jpeg");
  });

  await t.test("detects PNG magic bytes", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    assert.equal(detectMagicBytes(buffer), "image/png");
  });

  await t.test("detects WebP magic bytes", () => {
    const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
    assert.equal(detectMagicBytes(buffer), "image/webp");
  });

  await t.test("returns null for unknown magic bytes", () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    assert.equal(detectMagicBytes(buffer), null);
  });

  await t.test("returns null for empty buffer", () => {
    const buffer = Buffer.from([]);
    assert.equal(detectMagicBytes(buffer), null);
  });

  await t.test("returns null for buffer shorter than signature", () => {
    const buffer = Buffer.from([0xFF, 0xD8]);
    assert.equal(detectMagicBytes(buffer), null);
  });
});

test("UploadError", async (t) => {
  const { UploadError } = await import("@/lib/upload");

  await t.test("sets code, statusCode, and message", () => {
    const error = new UploadError("FILE_TOO_LARGE", 413, "File too large");
    assert.equal(error.code, "FILE_TOO_LARGE");
    assert.equal(error.statusCode, 413);
    assert.equal(error.message, "File too large");
    assert.equal(error.name, "UploadError");
  });

  await t.test("is instance of Error", () => {
    const error = new UploadError("TEST", 400, "test");
    assert.ok(error instanceof Error);
  });
});
