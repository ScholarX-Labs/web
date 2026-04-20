import fs from "fs";
import path from "path";

const SCHEMA_PATH = path.join(process.cwd(), "src/db/schema/auth-schema.ts");

if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`Schema file not found at ${SCHEMA_PATH}`);
  process.exit(1);
}

let content = fs.readFileSync(SCHEMA_PATH, "utf-8");

// 1. Ensure 'sql' is imported from drizzle-orm
if (!content.includes('import { sql } from "drizzle-orm"')) {
  content = content.replace(
    'import { relations } from "drizzle-orm";',
    'import { relations, sql } from "drizzle-orm";'
  );
}

// 2. Fix array defaults
// Finds: .array().default([])
// Replaces with: .array().default(sql`'{}'::text[]`)
const arrayDefaultRegex = /\.array\(\)\.default\(\[\]\)/g;
const fixedArrayDefault = '.array().default(sql`\'{}\'::text[]`)';

if (arrayDefaultRegex.test(content)) {
  console.log("Fixing array defaults...");
  content = content.replace(arrayDefaultRegex, fixedArrayDefault);
}

// 3. Optional: Add a comment to the top to warn other developers
const warning = "// [AUTO-FIXED] Array defaults and other Postgres-specific patches applied by scripts/fix-auth-schema.js\n";
if (!content.startsWith(warning)) {
    content = warning + content;
}

fs.writeFileSync(SCHEMA_PATH, content);
console.log("Successfully patched auth-schema.ts");
