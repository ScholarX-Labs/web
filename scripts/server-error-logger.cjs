/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

// Loaded via --require from standalone root (server.js directory) or repo root.
// In standalone the preload is copied to the root, so __dirname IS the root.
// When invoked from scripts/ directory, resolve up one level.
const rootDir = path.basename(__dirname) === "scripts"
  ? path.resolve(__dirname, "..")
  : __dirname;

const formatError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      cause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
              stack: error.cause.stack,
            }
          : error.cause,
    };
  }

  return { value: error };
};

const patchRoutesManifest = () => {
  const manifestPath = path.join(rootDir, ".next", "routes-manifest.json");

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    let changed = false;

    if (!Array.isArray(manifest.headers)) {
      manifest.headers = [];
      changed = true;
    }

    if (!Array.isArray(manifest.onMatchHeaders)) {
      manifest.onMatchHeaders = [];
      changed = true;
    }

    if (!Array.isArray(manifest.redirects)) {
      manifest.redirects = [];
      changed = true;
    }

    if (!manifest.rewrites || Array.isArray(manifest.rewrites)) {
      manifest.rewrites = {
        beforeFiles: [],
        afterFiles: Array.isArray(manifest.rewrites) ? manifest.rewrites : [],
        fallback: [],
      };
      changed = true;
    } else {
      for (const key of ["beforeFiles", "afterFiles", "fallback"]) {
        if (!Array.isArray(manifest.rewrites[key])) {
          manifest.rewrites[key] = [];
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.info("[server-error-logger] patched routes-manifest.json", {
        headers: manifest.headers.length,
        onMatchHeaders: manifest.onMatchHeaders.length,
        redirects: manifest.redirects.length,
      });
    } else {
      console.info("[server-error-logger] routes-manifest.json ok", {
        headers: manifest.headers.length,
        onMatchHeaders: manifest.onMatchHeaders.length,
        redirects: manifest.redirects.length,
      });
    }
  } catch (error) {
    console.error("[server-error-logger] routes manifest patch failed", {
      manifestPath,
      error: formatError(error),
    });
  }
};

patchRoutesManifest();

process.on("uncaughtException", (error) => {
  console.error("[node:uncaughtException]", formatError(error));
});

process.on("unhandledRejection", (reason) => {
  console.error("[node:unhandledRejection]", formatError(reason));
});

const originalConsoleError = console.error.bind(console);

console.error = (...args) => {
  for (const arg of args) {
    if (arg instanceof Error) {
      originalConsoleError("[console.error:Error]", formatError(arg));
    }
  }

  originalConsoleError(...args);
};

console.info("[server-error-logger] installed");
