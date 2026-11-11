import { describe, expect, it } from 'vitest'

import {
  HOLD_MS,
  isHold,
  isSwipeDown,
  PHOTO_DURATION_MS,
  segmentFill,
  stepStory,
  storyAge,
  tapSide,
} from './story-player'

describe('tapSide', () => {
  it('left third goes back, the rest goes forward', () => {
    expect(tapSide(0, 300)).toBe('prev')
    expect(tapSide(99, 300)).toBe('prev')
    expect(tapSide(100, 300)).toBe('next')
    expect(tapSide(299, 300)).toBe('next')
  })
  it('a zero-width box goes forward', () => {
    expect(tapSide(0, 0)).toBe('next')
  })
})

describe('stepStory', () => {
  it('moves forward and back', () => {
    expect(stepStory(0, 1, 3)).toBe(1)
    expect(stepStory(2, -1, 3)).toBe(1)
  })
  it('next on the last story closes', () => {
    expect(stepStory(2, 1, 3)).toBe('close')
  })
  it('back on the first story restarts it', () => {
    expect(stepStory(0, -1, 3)).toBe(0)
  })
  it('an empty list closes', () => {
    expect(stepStory(0, 1, 0)).toBe('close')
  })
})

describe('segmentFill', () => {
  it('past bars are full, future bars empty, current follows progress', () => {
    expect(segmentFill(0, 2, 0.4)).toBe(1)
    expect(segmentFill(2, 2, 0.4)).toBe(0.4)
    expect(segmentFill(3, 2, 0.4)).toBe(0)
  })
  it('clamps progress to 0..1', () => {
    expect(segmentFill(1, 1, 1.7)).toBe(1)
    expect(segmentFill(1, 1, -0.2)).toBe(0)
    expect(segmentFill(1, 1, Number.NaN)).toBe(0)
  })
})

describe('isHold', () => {
  it('a press of HOLD_MS or longer is a hold, not a tap', () => {
    expect(isHold(1000, 1000 + HOLD_MS - 1)).toBe(false)
    expect(isHold(1000, 1000 + HOLD_MS)).toBe(true)
  })
})

describe('isSwipeDown', () => {
  it('needs a mostly vertical drag of more than 80px downwards', () => {
    expect(isSwipeDown(0, 81)).toBe(true)
    expect(isSwipeDown(0, 80)).toBe(false)
    expect(isSwipeDown(0, -120)).toBe(false)
    expect(isSwipeDown(100, 90)).toBe(false)
  })
})

describe('storyAge', () => {
  const now = new Date('2026-11-11T12:00:00Z').getTime()
  const ago = (ms: number) => new Date(now - ms).toISOString()
  it('uses short Thai units like Instagram', () => {
    expect(storyAge(ago(20_000), now)).toBe('เมื่อกี้')
    expect(storyAge(ago(5 * 60_000), now)).toBe('5 นาที')
    expect(storyAge(ago(3 * 3_600_000), now)).toBe('3 ชม.')
    expect(storyAge(ago(2 * 86_400_000), now)).toBe('2 วัน')
    expect(storyAge(ago(9 * 7 * 86_400_000), now)).toBe('9 สัปดาห์')
  })
  it('future or broken dates show nothing odd', () => {
    expect(storyAge(ago(-60_000), now)).toBe('เมื่อกี้')
    expect(storyAge('not a date', now)).toBe('')
  })
})

it('photos show for 5 seconds', () => {
  expect(PHOTO_DURATION_MS).toBe(5000)
})
