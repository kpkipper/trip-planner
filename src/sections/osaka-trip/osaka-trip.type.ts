export type Plan = {
  time: string
  description: string
  category?: string
  emoji?: string
  map?: string
}

export type ItineraryDay = {
  date: string
  dateISO: string
  title: string
  plans: Plan[]
}
