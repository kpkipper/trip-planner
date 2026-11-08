import { getJourneys } from '@/api/journey'

import { errorSummary } from './error-summary'
import { SHELL_PARAM } from './shell-param'

/**
 * Build-time params for dynamic trip routes: every public slug plus the
 * `_shell` placeholder. Never throws — if the API is unreachable only the
 * shell is generated so the build still succeeds.
 */
export async function tripStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const { data } = await getJourneys()
    const slugs = data.flatMap((country) => (country.plan ?? []).map((trip) => trip.slug))
    return [...slugs.filter((s) => s !== SHELL_PARAM), SHELL_PARAM].map((slug) => ({ slug }))
  } catch (err) {
    console.error('generateStaticParams: failed to load journeys:', errorSummary(err))
    return [{ slug: SHELL_PARAM }]
  }
}
