// Rules for the Instagram-style story viewer. Kept free of React so they can be unit tested.

// How long a photo stays on screen before the next story starts.
export const PHOTO_DURATION_MS = 5000
// A press at least this long pauses the story instead of counting as a tap.
export const HOLD_MS = 250
// A drag downwards further than this closes the viewer.
const SWIPE_CLOSE_PX = 80

// Tapping the left third goes back; anywhere else goes forward (as on Instagram).
export const tapSide = (x: number, width: number): 'prev' | 'next' =>
  width > 0 && x < width / 3 ? 'prev' : 'next'

// Index after moving by delta, or 'close' when moving past the last story.
// Going back from the first story restarts it.
export const stepStory = (index: number, delta: number, length: number): number | 'close' => {
  if (length <= 0) return 'close'
  const next = index + delta
  if (next >= length) return 'close'
  return Math.max(0, next)
}

// How full bar i is (0..1) while story `current` is at `progress`.
export const segmentFill = (i: number, current: number, progress: number): number => {
  if (i < current) return 1
  if (i > current) return 0
  if (!Number.isFinite(progress)) return 0
  return Math.min(1, Math.max(0, progress))
}

export const isHold = (downAt: number, upAt: number): boolean => upAt - downAt >= HOLD_MS

export const isSwipeDown = (dx: number, dy: number): boolean =>
  dy > SWIPE_CLOSE_PX && Math.abs(dy) > Math.abs(dx)

// Short age shown next to the uploader's name, e.g. "3 ชม.".
export const storyAge = (createdAt: string, now: number): string => {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.floor((now - t) / 1000)
  if (s < 60) return 'เมื่อกี้'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} นาที`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} วัน`
  return `${Math.floor(d / 7)} สัปดาห์`
}
