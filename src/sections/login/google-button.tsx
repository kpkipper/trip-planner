'use client'

import { useCallback, useEffect, useRef } from 'react'

import Script from 'next/script'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface Props {
  clientId: string
  onCredential: (idToken: string) => void
}

// Loads Google Identity Services only where this component is rendered (the login page).
export default function GoogleButton({ clientId, onCredential }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  const render = useCallback(() => {
    const gsi = window.google?.accounts.id
    if (!gsi || !containerRef.current) return
    gsi.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      callback: (response) => onCredentialRef.current(response.credential),
    })
    gsi.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'center',
      width: 300,
    })
  }, [clientId])

  useEffect(() => () => window.google?.accounts.id.cancel(), [])

  return (
    <>
      {/* onReady also runs when the script is already loaded (coming back to this page). */}
      <Script src={GSI_SRC} strategy="afterInteractive" onReady={render} />
      <div ref={containerRef} className="flex justify-center min-h-[44px]" />
    </>
  )
}
