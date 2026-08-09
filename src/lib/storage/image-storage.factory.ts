/**
 * createImageStorageAdapter
 *
 * Module-level factory for the active IImageStoragePort implementation.
 * Selection is driven by the UPLOAD_STORAGE_ADAPTER environment variable:
 *
 *   UPLOAD_STORAGE_ADAPTER=vercel  (default) → VercelBlobImageStorageAdapter
 *   UPLOAD_STORAGE_ADAPTER=azure            → AzureBlobImageStorageAdapter
 *
 * The adapter is a process-level singleton — one instance per server process,
 * not per request. This avoids repeated connection setup on every upload.
 *
 * Both adapters are lazily required at call time so neither SDK leaks into
 * the other adapter's bundle.
 */
import type { IImageStoragePort } from "./image-storage.port";

let _adapter: IImageStoragePort | null = null;

export function createImageStorageAdapter(): IImageStoragePort {
  if (_adapter) return _adapter;

  const choice = process.env.UPLOAD_STORAGE_ADAPTER ?? "vercel";

  if (choice === "azure") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AzureBlobImageStorageAdapter } = require(
      "./adapters/azure-blob-image-storage.adapter",
    ) as typeof import("./adapters/azure-blob-image-storage.adapter");
    _adapter = new AzureBlobImageStorageAdapter();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { VercelBlobImageStorageAdapter } = require(
      "./adapters/vercel-blob-image-storage.adapter",
    ) as typeof import("./adapters/vercel-blob-image-storage.adapter");
    _adapter = new VercelBlobImageStorageAdapter();
  }

  return _adapter!;
}

/**
 * Reset the singleton — intended for use in tests only.
 * Call this between tests that need different adapters.
 */
export function _resetImageStorageAdapter(): void {
  _adapter = null;
}
