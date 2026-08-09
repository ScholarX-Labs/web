/**
 * VercelBlobImageStorageAdapter
 *
 * Implements IImageStoragePort using the Vercel Blob SDK (@vercel/blob).
 * This is the default active adapter in production.
 *
 * Requires BLOB_READ_WRITE_TOKEN to be set (auto-injected by Vercel when
 * a Blob store is linked to the project).
 *
 * All uploaded blobs use `access: "public"` — URLs are directly readable
 * by browsers without authentication, matching the previous Azure behaviour.
 */
import { put, del, list } from "@vercel/blob";
import type { IImageStoragePort, ImageUploadInput } from "../image-storage.port";
import { UploadError } from "@/lib/upload-errors";

function parseCacheControlMaxAge(cc: string): number {
  const match = /max-age=(\d+)/.exec(cc);
  return match ? parseInt(match[1], 10) : 86400;
}

export class VercelBlobImageStorageAdapter implements IImageStoragePort {
  async upload(input: ImageUploadInput): Promise<string> {
    try {
      const { url } = await put(input.path, input.content, {
        access: "public",
        contentType: input.contentType,
        cacheControlMaxAge: input.cacheControl
          ? parseCacheControlMaxAge(input.cacheControl)
          : 86400,
      });
      return url;
    } catch (error) {
      console.error("[vercel-blob] Upload error:", error);
      throw new UploadError("UPLOAD_FAILED", 500, "Failed to upload to storage");
    }
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      // Log but never throw — orphaned blobs are not fatal.
      console.error("[vercel-blob] Failed to delete blob:", error);
    }
  }

  async calculateUsageBytes(pathPrefixes: string[]): Promise<number> {
    let total = 0;
    try {
      for (const prefix of pathPrefixes) {
        let cursor: string | undefined;
        do {
          const result = await list({ prefix, cursor, limit: 1000 });
          total += result.blobs.reduce((sum, b) => sum + b.size, 0);
          cursor = result.cursor;
        } while (cursor);
      }
    } catch (error) {
      console.error("[vercel-blob] Failed to calculate usage:", error);
    }
    return total;
  }
}
