export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 26);
}

export function randomSuffix(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length);
}
