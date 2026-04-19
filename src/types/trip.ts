export interface Activity {
  id: string
  time: string
  description: string
  mapUrl?: string
  emoji?: string
}

export interface TripDay {
  id: string
  date: string
  dateISO: string
  title: string
  activities: Activity[]
}

export interface Trip {
  id: string
  title: string
  destination: string
  country: string
  startDate: string
  endDate: string
  days: TripDay[]
  createdAt: string
  updatedAt: string
}
