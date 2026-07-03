process.env.DATABASE_URL = "postgres://localhost:5432/scholarx";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-secret-value-longer-than-32-chars-for-safety";

// Define the global database mock instance before imports
const mockDbInstance = {
  update: () => {
    return {
      set: () => ({
        where: () => Promise.resolve(),
      }),
    };
  },
};
(globalThis as any).__MOCK_DB__ = mockDbInstance;

// Mock server-only before importing PATCH, auth or db
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as any;

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { PATCH } from "../../../src/app/api/v1/me/locale/route";
import { auth } from "../../../src/lib/auth";
import { mock } from "node:test";

describe("Locale Preference API Route", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test("returns 401 if user is not authenticated", async () => {
    mock.method(auth.api, "getSession", async () => null);

    const req = {
      headers: new Headers(),
    } as any;

    const res = await PATCH(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 400 if body is invalid", async () => {
    mock.method(auth.api, "getSession", async () => ({
      user: { id: "user-1" },
    }));

    const req = {
      headers: new Headers(),
      json: async () => ({ locale: "invalid" }),
    } as any;

    const res = await PATCH(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, { error: "Invalid locale" });
  });

  test("updates locale and returns 200 on success", async () => {
    mock.method(auth.api, "getSession", async () => ({
      user: { id: "user-1" },
    }));

    const updateMock = mock.method(mockDbInstance, "update", () => {
      return {
        set: () => ({
          where: () => Promise.resolve(),
        }),
      };
    });

    const req = {
      headers: new Headers(),
      json: async () => ({ locale: "ar" }),
    } as any;

    const res = await PATCH(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { locale: "ar" });
    assert.equal(updateMock.mock.calls.length, 1);
  });
});
