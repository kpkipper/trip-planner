export function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-')
}
