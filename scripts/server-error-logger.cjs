const fs = require("node:fs");
const path = require("node:path");

// When used as --require from the standalone root (where server.js lives),
// __dirname IS the standalone root.
const rootDir = __dirname;

// Oryx replaces the standalone's node_modules with a symlink to /node_modules
// and renames the real one to _del_node_modules.  Restore it here so the
// standalone's own dep tree (which includes @swc/helpers at the correct version)
// is used instead of the stale system tar.gz extraction.
const nm = path.join(rootDir, "node_modules");
const backup = path.join(rootDir, "_del_node_modules");

try {
  if (fs.existsSync(backup)) {
    const st = fs.lstatSync(nm);
    if (st.isSymbolicLink() || st.isDirectory()) {
      fs.rmSync(nm, { recursive: true, force: true });
    }
    fs.renameSync(backup, nm);
    console.info("[server-error-logger] restored node_modules from _del_node_modules");
  }
} catch {
  // non-fatal – server.js will fail with a clear module-not-found message
}

// Safety net: Node reads NODE_PATH once at process start and caches it;
// deleting at runtime has no effect, but clear it in case a future version
// re-reads on module load.
delete process.env.NODE_PATH;

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
