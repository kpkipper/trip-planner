import type { LoginMethods } from '@/api/auth/type'

// Which login options the page shows. `methods` is null when the server could not be
// asked (older API, network error): then show what the web app can offer, as before.
export const visibleLoginMethods = (
  methods: LoginMethods | null,
  hasGoogleClient: boolean,
): LoginMethods =>
  methods
    ? { email: methods.email, google: methods.google && hasGoogleClient }
    : { email: true, google: hasGoogleClient }
