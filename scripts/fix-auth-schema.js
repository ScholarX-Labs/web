import fs from "fs";
import path from "path";

const SCHEMA_PATH = path.join(process.cwd(), "src/db/schema/auth-schema.ts");

if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`Schema file not found at ${SCHEMA_PATH}`);
  process.exit(1);
}

let content = fs.readFileSync(SCHEMA_PATH, "utf-8");

// 1. Ensure 'sql' is imported from drizzle-orm
const drizzleImportRegex =
  /import\s*\{([\s\S]*?)\}\s*from\s*["']drizzle-orm["'];?/g;
if (content.includes('from "drizzle-orm"')) {
  if (!/\bsql\b/.test(content.match(drizzleImportRegex)?.[0] || "")) {
    content = content.replace(drizzleImportRegex, (match, imports) => {
      if (imports.includes("sql")) return match;
      const trimmedImports = imports.trim();
      if (trimmedImports.endsWith(",")) {
        return `import { ${trimmedImports} sql } from "drizzle-orm";`;
      }
      return `import { ${trimmedImports}${trimmedImports ? ", " : ""}sql } from "drizzle-orm";`;
    });
  }
} else {
  content = `import { sql } from "drizzle-orm";\n` + content;
}

// 2. Fix array defaults
// Finds: .array().default([])
// Replaces with: .array().default(sql`'{}'::text[]`)
const arrayDefaultRegex = /\.array\(\)\.default\(\[\]\)/;
const fixedArrayDefault = ".array().default(sql`'{}'::text[]`)";

console.log("Fixing array defaults...");
content = content.replace(
  new RegExp(arrayDefaultRegex, "g"),
  fixedArrayDefault,
);

// 3. Optional: Add a comment to the top to warn other developers
const warning =
  "// [AUTO-FIXED] Array defaults and other Postgres-specific patches applied by scripts/fix-auth-schema.js\n";
if (!content.startsWith(warning)) {
  content = warning + content;
}

fs.writeFileSync(SCHEMA_PATH, content);
console.log("Successfully patched auth-schema.ts");
