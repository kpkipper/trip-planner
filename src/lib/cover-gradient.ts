// Deterministic cover for trips without a photo: the same slug always gets the
// same gradient, picked by a stable string hash from a fixed set of palettes.

const PALETTES = [
  ['#1e3a8a', '#7c3aed', '#f97316'],
  ['#0ea5e9', '#6366f1', '#ec4899'],
  ['#fb923c', '#f43f5e', '#9d174d'],
  ['#22d3ee', '#3b82f6', '#1e3a8a'],
  ['#a3e635', '#10b981', '#0f766e'],
  ['#c084fc', '#6366f1', '#1e1b4b'],
  ['#fde047', '#f97316', '#be123c'],
  ['#94a3b8', '#334155', '#0f172a'],
] as const

// FNV-1a: tiny, stable across runtimes, spreads short similar strings well.
function hash(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function coverGradient(seed: string): string {
  const [a, b, c] = PALETTES[hash(seed) % PALETTES.length]
  return `linear-gradient(160deg, ${a} 0%, ${b} 45%, ${c} 100%)`
}
