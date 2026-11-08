const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

// Escapes a value for use in HTML text or a quoted attribute.
export const escapeHtml = (value: string | number | null | undefined): string =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ENTITIES[ch])
