import type { EventName } from './events'

/**
 * Client-side analytics wrapper.
 *
 * Currently a lightweight abstraction that can be wired to any provider
 * (Plausible, PostHog, etc.) by updating the track() implementation.
 *
 * To enable Plausible: add the script tag to __root.tsx and uncomment the plausible call.
 * To enable PostHog: install posthog-js, init in root, and uncomment the posthog call.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

/**
 * Track a custom event with optional properties.
 */
export function track(event: EventName, props?: Record<string, string | number>) {
  // Plausible (if loaded via script tag)
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, props ?? '')
  }
}

/**
 * Track a page view. Called automatically by router if integrated,
 * or manually for SPA navigation.
 */
export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('pageview', { props: { path } })
  }

  if (import.meta.env.DEV) {
    console.log(`[Analytics] pageview`, { path })
  }
}
