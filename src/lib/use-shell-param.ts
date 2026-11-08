'use client'

import { useSyncExternalStore } from 'react'

import { usePathname } from 'next/navigation'

import { resolveShellParam } from './shell-param'

const subscribe = () => () => {}

/**
 * Resolves a dynamic route param on the client. For prerendered pages the `param` is used
 * as-is; for the `_shell` placeholder (served by Firebase rewrites for unknown slugs) the
 * real value comes from usePathname(), so soft navigation between slugs updates it.
 * Returns undefined until hydrated (shell only), null if the path has no value.
 */
export function useShellParam(param: string, prefix: string): string | null | undefined {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const routerPath = usePathname()
  return resolveShellParam(
    param,
    prefix,
    hydrated,
    routerPath,
    hydrated ? window.location.pathname : '',
  )
}
