// Audit: ensure no hardcoded "auth" schema literals remain outside the
// canonical source (src/db/schema/namespaces.ts).
//
// Part of 020-auth-schema-migration. Enforced via `pnpm audit:schema-literals`
// (run as part of `pnpm lint` in CI). See specs/020-auth-schema-migration/contracts/db-namespace.md §4.
//
// Exit code 0 = clean, 1 = violations found (file path + line printed).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "drizzle", "scripts", "docs"];
const EXTRA_FILES = ["drizzle.config.ts"];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
]);
const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".sql",
  ".json",
  ".md",
]);

// Historical reference material that legitimately documents the old name.
const ALLOWED_REL_PREFIXES = ["drizzle/meta/"];
const ALLOWED_REL_FILES = [
  "scripts/audit-schema-literals.mjs",
  "specs/020-auth-schema-migration/research.md",
  "docs/consumer-audit-020.md",
];

const PATTERNS = [
  { name: 'pgSchema("auth")', regex: /pgSchema\(\s*["']auth["']\s*\)/g },
  { name: '"auth".', regex: /["']auth["']\./g },
  { name: "from auth.", regex: /\bfrom\s+auth\./gi },
  { name: "join auth.", regex: /\bjoin\s+auth\./gi },
  { name: 'schema: "auth"', regex: /schema\s*:\s*["']auth["']/g },
  { name: 'CREATE SCHEMA "auth"', regex: /create\s+schema\s+["']auth["']/gi },
];

function isAllowed(relPath) {
  for (const prefix of ALLOWED_REL_PREFIXES) {
    if (relPath.startsWith(prefix)) return true;
  }
  return ALLOWED_REL_FILES.includes(relPath);
}

function collectFiles() {
  const files = new Set(EXTRA_FILES.map((file) => path.join(ROOT, file)));
  const visit = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
      } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
        files.add(full);
      }
    }
  };
  for (const dir of SCAN_DIRS) {
    visit(path.join(ROOT, dir));
  }
  return files;
}

function audit() {
  const violations = [];
  for (const file of collectFiles()) {
    const relPath = path.relative(ROOT, file).split(path.sep).join("/");
    if (isAllowed(relPath)) continue;

    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of PATTERNS) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(line)) {
          violations.push(`${relPath}:${index + 1}: ${pattern.name}`);
        }
      }
    }
  }
  return violations;
}

const violations = audit();

if (violations.length > 0) {
  console.error(`[audit:schema-literals] ${violations.length} violation(s) found:`);
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  console.error(
    "[audit:schema-literals] All auth schema names must resolve from src/db/schema/namespaces.ts.",
  );
  process.exit(1);
}

console.log("[audit:schema-literals] Clean: no hardcoded auth schema literals.");
