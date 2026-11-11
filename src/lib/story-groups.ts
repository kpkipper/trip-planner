import type { PublicProfileType } from '@/api/journey/type'
import type { MomentView } from '@/api/moments/type'

export interface StoryGroup {
  uploader: PublicProfileType
  // Index of the uploader's first moment in the input list (opens the viewer there).
  start: number
  count: number
}

// One story ring per uploader, in first-appearance order.
export function storyGroups(moments: MomentView[]): StoryGroup[] {
  const groups: StoryGroup[] = []
  const byUser = new Map<string, StoryGroup>()
  moments.forEach((m, i) => {
    const key = m.uploader.username
    const found = byUser.get(key)
    if (found) {
      found.count++
      return
    }
    const g = { uploader: m.uploader, start: i, count: 1 }
    byUser.set(key, g)
    groups.push(g)
  })
  return groups
}
