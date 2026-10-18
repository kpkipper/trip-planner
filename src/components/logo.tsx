'use client'

import { useId } from 'react'

interface LogoProps {
  size?: number
  textSize?: number
  showText?: boolean
  className?: string
}

export default function Logo({
  size = 28,
  textSize = Math.round(size * 0.68),
  showText = true,
  className = '',
}: LogoProps) {
  // Unique per instance so multiple <Logo>s (sidebar, mobile header) don't
  // collide on the same gradient id — a collision breaks the fill when the
  // first definition sits inside a display:none subtree.
  const gradId = `jourly-plane-${useId().replace(/:/g, '')}`

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Jourly Plan logo"
        role="img"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#16aef2" />
            <stop offset="1" stopColor="#0163a4" />
          </linearGradient>
        </defs>
        <polygon points="34 5 6 14 17 19" fill={`url(#${gradId})`} />
        <polygon points="34 5 17 19 22 32" fill="#014a7d" />
      </svg>
      {showText && (
        <span
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-outfit), sans-serif',
            fontWeight: 800,
            fontSize: textSize,
            lineHeight: 1.25,
            padding: '0.04em 0.06em',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            background: 'linear-gradient(100deg, #0163a4, #16aef2)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Jourly Plan
        </span>
      )}
    </span>
  )
}
