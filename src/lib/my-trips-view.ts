export type MyTripsView = 'loading' | 'error' | 'empty' | 'list'

interface State {
  // The login state is known and the viewer is logged in.
  authed: boolean
  // The latest fetch finished (successfully or not).
  loaded: boolean
  // The latest fetch failed.
  error: boolean
  // No trips (own or shared) to show.
  empty: boolean
}

// What /trips shows. The list refetches on every navigation, so an existing list stays up
// while it reloads or when a refetch fails; "no trips" is only claimed after a successful fetch.
export const myTripsView = ({ authed, loaded, error, empty }: State): MyTripsView => {
  if (!empty && authed) return 'list'
  if (!authed || !loaded) return 'loading'
  return error ? 'error' : 'empty'
}
