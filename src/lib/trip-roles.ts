export interface TripActions {
  edit: boolean
  delete: boolean
  leave: boolean
  export: boolean
}

// The API is the real gate; this only decides which buttons to show.
export const tripActions = (role: string | undefined, redacted: boolean): TripActions => ({
  edit: role === 'owner' || role === 'editor',
  delete: role === 'owner',
  leave: role === 'editor' || role === 'traveler',
  export: !redacted,
})
