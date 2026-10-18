import { ImageResponse } from 'next/og'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const fontsDir = join(process.cwd(), 'src/assets/fonts')
const outfitExtraBold = readFileSync(join(fontsDir, 'Outfit-ExtraBold.ttf'))
const outfitMedium = readFileSync(join(fontsDir, 'Outfit-Medium.ttf'))
const notoThai = readFileSync(join(fontsDir, 'NotoSansThai-Bold.ttf'))

// Plane mark as a data URI so Satori renders it reliably as an <img>.
const planeUri = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<polygon points="34 5 6 14 17 19" fill="#ffffff"/>' +
    '<polygon points="34 5 17 19 22 32" fill="#bcdff8"/></svg>',
).toString('base64')}`

/**
 * Keep only characters our embedded fonts can render (Latin + Thai), dropping
 * emoji and other scripts so Satori never hits a missing glyph at build time.
 */
export function cleanText(input?: string): string {
  return (input ?? '')
    .replace(/[^ -~฀-๿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function ogImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '78px 90px',
          background: 'linear-gradient(135deg, #0a86d6, #013f6d)',
          fontFamily: 'Outfit, "Noto Sans Thai"',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={planeUri} width={138} height={138} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: 6,
                color: '#8fd0f6',
                marginBottom: 14,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: 'flex',
                fontSize: 36,
                fontWeight: 500,
                color: '#cfe8fb',
                marginTop: 18,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Outfit', data: outfitExtraBold, weight: 800, style: 'normal' },
        { name: 'Outfit', data: outfitMedium, weight: 500, style: 'normal' },
        { name: 'Noto Sans Thai', data: notoThai, weight: 700, style: 'normal' },
      ],
    },
  )
}
