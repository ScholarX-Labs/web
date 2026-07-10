/* eslint-disable @typescript-eslint/no-explicit-any */
import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextResponse } from "next/server";
import { proxy } from "../../../src/proxy";
import { mock } from "node:test";

describe("Access Boundaries Middleware Proxy", () => {
  const originalEnv = process.env.ARABIC_ENABLED;

  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    process.env.ARABIC_ENABLED = originalEnv;
  });

  test("allows public and excluded API routes directly without redirect", () => {
    const nextMock = mock.method(NextResponse, "next", () => ({ type: "next" }));

    const req = {
      nextUrl: { pathname: "/api/health" },
      url: "http://localhost:3000/api/health",
      cookies: { get: () => null },
    } as any;

    const res = proxy(req);
    assert.deepEqual(res, { type: "next" });
    assert.equal(nextMock.mock.calls.length, 1);
  });

  test("redirects protected route if not authenticated", () => {
    const redirectMock = mock.method(NextResponse, "redirect", (url: any) => ({ type: "redirect", url }));

    const req = {
      nextUrl: { pathname: "/profile" },
      url: "http://localhost:3000/profile",
      cookies: { get: () => null },
    } as any;

    proxy(req);
    assert.equal(redirectMock.mock.calls.length, 1);
  });

  test("redirects Arabic routes to English when ARABIC_ENABLED is false", () => {
    process.env.ARABIC_ENABLED = "false";
    const redirectMock = mock.method(NextResponse, "redirect", (url: any) => ({ type: "redirect", url }));

    const req = {
      nextUrl: { pathname: "/ar/about" },
      url: "http://localhost:3000/ar/about",
      cookies: { get: () => null },
    } as any;

    const res = proxy(req) as any;
    assert.equal(redirectMock.mock.calls.length, 1);
    assert.ok(res.url.toString().includes("/about"));
  });
});
