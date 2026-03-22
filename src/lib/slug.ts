export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 60);

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
