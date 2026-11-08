'use client'

import { useSyncExternalStore } from 'react'

import { SHELL_PARAM, slugFromPath } from './shell-param'

const subscribe = () => () => {}

/**
 * Resolves a dynamic route param on the client. For prerendered pages the
 * `param` is used as-is; for the `_shell` placeholder (served by Firebase
 * rewrites for unknown slugs) the real value is read from location.pathname.
 * Returns undefined until hydrated (shell only), null if the path has no value.
 */
export function useShellParam(param: string, prefix: string): string | null | undefined {
  const fromPath = useSyncExternalStore(
    subscribe,
    () => slugFromPath(window.location.pathname, prefix),
    () => undefined,
  )
  return param === SHELL_PARAM ? fromPath : param
}
