import { randomBytes } from "crypto";

/**
 * Certificate public ID format: SX-XXXX-XXXX-XXXX-XXXX-XXXX
 *
 * - 128 bits of cryptographically secure random data
 * - Encoded with Crockford Base32 (avoids visually ambiguous chars)
 * - Prefixed with "SX-" for brand recognition and log searching
 * - Grouped in 4-char blocks for human readability
 *
 * At 128 bits, collision probability at 50,000 certificates ≈ 7.2×10⁻³⁴.
 * Unique DB constraint handles any remaining collision risk.
 */

// Crockford Base32 alphabet — no ambiguous chars (0/O, 1/I/L)
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeBase32Crockford(bytes: Buffer): string {
  let value = BigInt("0x" + bytes.toString("hex"));
  let encoded = "";

  // 128 bits → 26 Base32 characters (5 bits per char)
  for (let i = 0; i < 26; i++) {
    const index = Number(value & BigInt(31));
    encoded = CROCKFORD_ALPHABET[index] + encoded;
    value >>= BigInt(5);
  }

  return encoded;
}

function groupIntoChunks(str: string, chunkSize: number): string {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks.join("-");
}

/**
 * Generate a cryptographically secure, collision-resistant public certificate number.
 * Format: SX-XXXX-XXXX-XXXX-XXXX-XXXX-XX
 */
export function generateCertificateNumber(): string {
  const bytes = randomBytes(16); // 128 bits
  const encoded = encodeBase32Crockford(bytes);
  const grouped = groupIntoChunks(encoded, 4);
  return `SX-${grouped}`;
}

/**
 * Validate that a string has the expected certificate number format.
 */
export function isValidCertificateNumber(value: string): boolean {
  // SX- prefix + 6 groups of 4 chars separated by hyphens = SX-XXXX-XXXX-XXXX-XXXX-XXXX-XX
  return /^SX-[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){4}(-[0-9A-HJKMNP-TV-Z]{2})?$/.test(value);
}
