import { readFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_LOCALE = "en";
const SUPPORTED_LOCALES = ["en", "ar"];
const MESSAGE_NAMESPACES = [
  "common",
  "home",
  "courses",
  "auth",
  "profile",
  "about",
  "contact",
  "certificates",
  "opportunities",
  "aiSearch",
  "metadata",
  "email",
];
const STUB_VALUE = "__NEEDS_TRANSLATION__";

function flattenKeys(value, prefix = "") {
  return Object.entries(value).reduce((accumulator, [key, nested]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedEntries = flattenKeys(nested, fullKey);

      for (const [childKey, childValue] of nestedEntries.entries()) {
        accumulator.set(childKey, childValue);
      }

      return accumulator;
    }

    accumulator.set(fullKey, nested);
    return accumulator;
  }, new Map());
}

let hasErrors = false;

for (const locale of SUPPORTED_LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;

  for (const namespace of MESSAGE_NAMESPACES) {
    const englishFile = path.join(
      process.cwd(),
      "src",
      "messages",
      DEFAULT_LOCALE,
      `${namespace}.json`,
    );
    const localeFile = path.join(
      process.cwd(),
      "src",
      "messages",
      locale,
      `${namespace}.json`,
    );

    const englishKeys = flattenKeys(JSON.parse(readFileSync(englishFile, "utf8")));
    const localeKeys = flattenKeys(JSON.parse(readFileSync(localeFile, "utf8")));

    const missingKeys = [...englishKeys.keys()].filter(
      (key) => !localeKeys.has(key),
    );
    const stubKeys = [...localeKeys.entries()]
      .filter(([, value]) => value === STUB_VALUE)
      .map(([key]) => key);

    if (missingKeys.length > 0 || stubKeys.length > 0) {
      hasErrors = true;
      console.error(
        `[FAIL] ${locale}/${namespace} missing=${missingKeys.join(",") || "none"} stub=${stubKeys.join(",") || "none"}`,
      );
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log("Translation coverage check passed.");
