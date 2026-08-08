import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/db/schema/**"],
    rules: {
      "import/no-cycle": ["error", { maxDepth: 1 }],
    },
  },
  {
    files: ["src/db/schema/namespaces.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db/**", "src/db/**", "../*"],
              message:
                "src/db/schema/namespaces.ts must remain a leaf module and cannot import from src/db/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "*.min.js",
    "next-env.d.ts",
    ".agents/**",
    ".agent/**",
  ]),
]);

export default eslintConfig;
