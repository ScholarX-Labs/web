/**
 * Serializes JSON-LD safely for an inline script. Escaping `<` prevents
 * user-controlled content from prematurely closing the script element.
 */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  return (serialized ?? "null").replace(/</g, "\\u003c");
}
