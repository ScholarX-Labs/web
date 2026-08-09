/**
 * src/lib/storage/index.ts
 *
 * Public surface of the image storage subsystem.
 * Import from here — never import adapter files directly in application code.
 */
export type { IImageStoragePort, ImageUploadInput } from "./image-storage.port";
export { createImageStorageAdapter, _resetImageStorageAdapter } from "./image-storage.factory";
