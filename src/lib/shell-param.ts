export const SHELL_PARAM = '_shell'

/**
 * Extracts the dynamic segment that follows `prefix` from a pathname, e.g.
 * ("/plans/abc/edit", "/plans") → "abc". Handles trailing slashes, `.html`
 * and percent-encoding. Returns null when there is no segment or it is the
 * `_shell` placeholder itself.
 */
export function slugFromPath(pathname: string, prefix: string): string | null {
  const base = prefix.replace(/\/+$/, '')
  if (!pathname.startsWith(`${base}/`)) return null

  const raw = pathname
    .slice(base.length + 1)
    .split('/')[0]
    ?.replace(/\.html$/, '')
  if (!raw) return null

  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    // keep raw value on malformed escapes
  }

  return value === SHELL_PARAM ? null : value
}

/**
 * The param a shell page should render. Prerendered pages use their own `param`; for the
 * `_shell` placeholder the real value comes from the router's pathname (it follows soft
 * navigation) and falls back to the browser location when the router still reports the
 * placeholder URL itself (Firebase rewrite). `undefined` while not hydrated.
 */
export function resolveShellParam(
  param: string,
  prefix: string,
  hydrated: boolean,
  routerPath: string | null,
  locationPath: string,
): string | null | undefined {
  if (param !== SHELL_PARAM) return param
  if (!hydrated) return undefined
  return slugFromPath(routerPath ?? '', prefix) ?? slugFromPath(locationPath, prefix)
}
