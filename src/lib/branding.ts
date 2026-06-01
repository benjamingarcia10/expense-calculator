/**
 * Single source of truth for the app's brand name and tagline.
 *
 * To whitelabel the app, change these values here — every user-facing
 * reference picks the new name up automatically (UI strings, `<title>`,
 * Open Graph meta, wordmark, tour copy, receipt-export footer).
 *
 * To swap the brand by hostname or environment, replace the literal with
 * a computed value, e.g.:
 *
 *   export const APP_NAME =
 *     typeof window !== 'undefined' && window.location.hostname.endsWith('.foo.com')
 *       ? 'Foo'
 *       : 'Tally'
 *
 * The `branding.test.ts` validation guarantees the brand name is not
 * hardcoded anywhere else in the codebase (outside this file).
 */
export const APP_NAME = 'Tally'

/** Short product tagline. Paired with the name in titles. */
export const APP_TAGLINE = 'split expenses with friends'

/** Full title used in <title>, og:title, and the page-level h1 fallback. */
export const APP_FULL_TITLE = `${APP_NAME} — ${APP_TAGLINE}`
