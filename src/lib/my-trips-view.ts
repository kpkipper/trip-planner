export type MyTripsView = 'loading' | 'error' | 'empty' | 'list'

interface State {
  // The login state is known (logged in: own and shared trips; anonymous: the public list).
  ready: boolean
  // The latest fetch finished (successfully or not).
  loaded: boolean
  // The latest fetch failed.
  error: boolean
  // No trips (own or shared) to show.
  empty: boolean
}

// What /trips shows. The list refetches on every navigation, so an existing list stays up
// while it reloads or when a refetch fails; "no trips" is only claimed after a successful fetch.
export const myTripsView = ({ ready, loaded, error, empty }: State): MyTripsView => {
  if (!ready) return 'loading'
  if (!empty) return 'list'
  if (!loaded) return 'loading'
  return error ? 'error' : 'empty'
}
