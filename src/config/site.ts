/**
 * Central site metadata used across SEO surfaces (root metadata, sitemap,
 * robots, manifest, per-page metadata). Update `url` here if a custom domain
 * is added — everything else derives from it.
 */
export const siteConfig = {
  name: 'Jourly Plan',
  title: 'Jourly Plan — Plan Your Trips & Travel Itineraries',
  description:
    'Jourly Plan helps you organize trips and build day-by-day travel itineraries — keep every destination, activity, and plan in one beautiful place.',
  // Firebase hosting site: "jourlyplan". Swap for a custom domain when ready.
  url: 'https://jourlyplan.web.app',
  locale: 'en_US',
  themeColor: '#0163a4',
  keywords: [
    'trip planner',
    'travel itinerary',
    'itinerary maker',
    'vacation planner',
    'holiday planner',
    'trip organizer',
    'travel planning app',
    'day-by-day itinerary',
    'Jourly Plan',
  ],
  creator: 'Jourly Plan',
} as const
