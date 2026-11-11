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
        <polygon points="34 5 6 14 17 19" className="fill-accent" />
        <polygon points="34 5 17 19 22 32" className="fill-primary" />
      </svg>
      {showText && (
        <span
          className="inline-block whitespace-nowrap font-sans font-bold tracking-tight text-ink"
          style={{ fontSize: textSize, lineHeight: 1.25 }}
        >
          Jourly Plan
        </span>
      )}
    </span>
  )
}
