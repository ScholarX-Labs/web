import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, interpolate, buildEmailHtml } from "../../../src/lib/email/templates/base";
import { verificationEmail } from "../../../src/lib/email/templates/verification";
import { signinOtpEmail } from "../../../src/lib/email/templates/signin-otp";
import { passwordResetEmail } from "../../../src/lib/email/templates/password-reset";

describe("Email Templates System", () => {
  describe("escapeHtml helper", () => {
    test("escapes HTML control characters correctly", () => {
      const input = `<div> & "Hello" </div>`;
      const expected = `&lt;div&gt; &amp; &quot;Hello&quot; &lt;/div&gt;`;
      assert.equal(escapeHtml(input), expected);
    });
  });

  describe("interpolate helper", () => {
    test("interpolates variables correctly", () => {
      const template = "Hello {name}, your code is {code}!";
      const vars = { name: "Ahmed", code: "123456" };
      const expected = "Hello Ahmed, your code is 123456!";
      assert.equal(interpolate(template, vars), expected);
    });

    test("leaves missing keys unreplaced", () => {
      const template = "Hello {name}, your code is {code}!";
      const vars = { name: "Ahmed" };
      const expected = "Hello Ahmed, your code is {code}!";
      assert.equal(interpolate(template, vars), expected);
    });
  });

  describe("buildEmailHtml helper", () => {
    test("generates basic layout with correct lang and dir for English", () => {
      const html = buildEmailHtml({
        locale: "en",
        heading: "Welcome",
        body: "Hello world",
      });
      assert.ok(html.includes('lang="en-US"'));
      assert.ok(html.includes('dir="ltr"'));
      assert.ok(html.includes("Welcome"));
      assert.ok(html.includes("Hello world"));
    });

    test("generates layout with correct direction for Arabic", () => {
      const html = buildEmailHtml({
        locale: "ar",
        heading: "مرحباً",
        body: "مرحبا بك",
      });
      assert.ok(html.includes('lang="ar-EG"'));
      assert.ok(html.includes('dir="rtl"'));
      assert.ok(html.includes("rtl"));
    });
  });

  describe("verificationEmail template", () => {
    test("renders correctly in English", () => {
      const email = verificationEmail("en", "123456", 10);
      assert.ok(email.subject);
      assert.ok(email.text.includes("123456"));
      assert.ok(email.text.includes("10"));
    });

    test("renders correctly in Arabic", () => {
      const email = verificationEmail("ar", "123456", 10);
      assert.ok(email.subject);
      assert.ok(email.text.includes("123456"));
    });
  });

  describe("signinOtpEmail template", () => {
    test("renders correctly in English", () => {
      const email = signinOtpEmail("en", "654321", 10);
      assert.ok(email.subject);
      assert.ok(email.text.includes("654321"));
    });
  });

  describe("passwordResetEmail template", () => {
    test("renders correctly in English", () => {
      const email = passwordResetEmail("en", "https://example.com/reset");
      assert.ok(email.subject);
      assert.ok(email.html.includes("href=\"https://example.com/reset\""));
    });
  });
});
