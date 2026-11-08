export const DEFAULT_TIMEZONE = 'Asia/Bangkok'

const BY_COUNTRY: Record<string, string> = {
  japan: 'Asia/Tokyo',
  thailand: 'Asia/Bangkok',
  korea: 'Asia/Seoul',
  'south korea': 'Asia/Seoul',
  taiwan: 'Asia/Taipei',
  china: 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  singapore: 'Asia/Singapore',
  vietnam: 'Asia/Ho_Chi_Minh',
  malaysia: 'Asia/Kuala_Lumpur',
  indonesia: 'Asia/Jakarta',
  philippines: 'Asia/Manila',
  india: 'Asia/Kolkata',
  'united kingdom': 'Europe/London',
  france: 'Europe/Paris',
  germany: 'Europe/Berlin',
  italy: 'Europe/Rome',
  spain: 'Europe/Madrid',
  'united states': 'America/New_York',
  australia: 'Australia/Sydney',
}

export const guessTimezone = (country: string): string =>
  BY_COUNTRY[country.trim().toLowerCase()] ?? DEFAULT_TIMEZONE

// The zones the settings select offers, plus the current value when it is not among them.
export const timezoneOptions = (current?: string): string[] => {
  const zones = [...new Set([DEFAULT_TIMEZONE, ...Object.values(BY_COUNTRY)])].sort()
  return current && !zones.includes(current) ? [...zones, current] : zones
}
