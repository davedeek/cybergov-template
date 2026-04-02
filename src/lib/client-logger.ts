import type { EventName } from './events'

// --- Console logger ---

const isDev = import.meta.env.DEV

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`[INFO] ${message}`, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[WARN] ${message}`, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  },
}

// --- Analytics ---

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

/**
 * Track a custom event with optional properties.
 * Wired to Plausible (if loaded via script tag). Can be extended to PostHog or other providers.
 */
export function track(event: EventName, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  }

  if (isDev) {
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

  if (isDev) {
    console.log(`[Analytics] pageview`, { path })
  }
}
