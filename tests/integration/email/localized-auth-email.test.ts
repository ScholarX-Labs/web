process.env.DATABASE_URL = "postgres://localhost:5432/scholarx";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-secret-value-longer-than-32-chars-for-safety";

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";

// Mock database query results
let mockUserLocale = "en";
const mockDbInstance = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([{ locale: mockUserLocale }]),
      }),
    }),
  }),
  insert: () => ({
    values: () => Promise.resolve(),
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve(),
    }),
  }),
};
(globalThis as any).__MOCK_DB__ = mockDbInstance;

// Mock server-only
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as any;

// Mock the email delivery service factory
import * as factory from "../../../src/domain/email/factory/email-service.factory";
const sentEmails: any[] = [];
const mockService = {
  sendEmail: async (options: any) => {
    sentEmails.push(options);
    return { ok: true, providerMessageId: "msg-123" };
  },
};
mock.method(factory, "createDefaultEmailDeliveryService", () => mockService);

import { auth } from "../../../src/lib/auth";

describe("Localized Auth Email Flows", () => {
  beforeEach(() => {
    sentEmails.length = 0;
    mockUserLocale = "en";
  });

  test("sends verification OTP in English", async () => {
    mockUserLocale = "en";
    
    // Trigger verification email flow
    const emailOtpPlugin = auth.options.plugins.find(
      (p: any) => p.id === "email-otp"
    ) as any;
    
    assert.ok(emailOtpPlugin);
    await emailOtpPlugin.options.sendVerificationOTP({
      email: "user@example.com",
      otp: "123456",
      type: "email-verification",
    });

    assert.equal(sentEmails.length, 1);
    const email = sentEmails[0];
    assert.equal(email.to, "user@example.com");
    assert.ok(email.subject.includes("Verify"));
    assert.ok(email.text.includes("123456"));
  });

  test("sends verification OTP in Arabic", async () => {
    mockUserLocale = "ar";
    
    const emailOtpPlugin = auth.options.plugins.find(
      (p: any) => p.id === "email-otp"
    ) as any;
    
    await emailOtpPlugin.options.sendVerificationOTP({
      email: "arabic-user@example.com",
      otp: "654321",
      type: "email-verification",
    });

    assert.equal(sentEmails.length, 1);
    const email = sentEmails[0];
    assert.equal(email.to, "arabic-user@example.com");
    assert.ok(email.subject.includes("تأكيد"));
    assert.ok(email.text.includes("654321"));
  });

  test("sends password reset link in English", async () => {
    mockUserLocale = "en";
    
    await auth.options.emailAndPassword.sendResetPassword({
      user: {
        id: "user-1",
        email: "user@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      url: "https://example.com/reset-password?token=abc",
    });

    assert.equal(sentEmails.length, 1);
    const email = sentEmails[0];
    assert.equal(email.to, "user@example.com");
    assert.ok(email.subject.includes("Reset"));
    assert.ok(email.text.includes("https://example.com/reset-password?token=abc"));
  });

  test("sends password reset link in Arabic", async () => {
    mockUserLocale = "ar";
    
    await auth.options.emailAndPassword.sendResetPassword({
      user: {
        id: "user-2",
        email: "arabic-user@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      url: "https://example.com/reset-password?token=xyz",
    });

    assert.equal(sentEmails.length, 1);
    const email = sentEmails[0];
    assert.equal(email.to, "arabic-user@example.com");
    assert.ok(email.subject.includes("إعادة"));
    assert.ok(email.text.includes("https://example.com/reset-password?token=xyz"));
  });
});
