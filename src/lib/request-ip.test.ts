import assert from "node:assert/strict";
import test from "node:test";
import { getClientIpFromHeaders } from "./request-ip";

function headers(values: Record<string, string | null>): Pick<Headers, "get"> {
  return {
    get: (name: string) => values[name.toLowerCase()] ?? null,
  };
}

test("getClientIpFromHeaders accepts valid forwarded IPv4 addresses", () => {
  assert.equal(
    getClientIpFromHeaders(headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" })),
    "203.0.113.10",
  );
});

test("getClientIpFromHeaders strips IPv4 ports", () => {
  assert.equal(
    getClientIpFromHeaders(headers({ "x-forwarded-for": "203.0.113.10:443" })),
    "203.0.113.10",
  );
});

test("getClientIpFromHeaders strips IPv6 brackets and ports", () => {
  assert.equal(
    getClientIpFromHeaders(headers({ "x-forwarded-for": "[2001:db8::1]:443" })),
    "2001:db8::1",
  );
});

test("getClientIpFromHeaders rejects malformed high-cardinality values", () => {
  assert.equal(
    getClientIpFromHeaders(headers({ "x-forwarded-for": "not-an-ip-12345" })),
    null,
  );
});

test("getClientIpFromHeaders returns null when no IP headers are present", () => {
  assert.equal(
    getClientIpFromHeaders(headers({})),
    null,
  );
});
