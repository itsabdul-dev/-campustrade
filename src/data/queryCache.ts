/**
 * Results already fetched, keyed by query. Revisiting a screen renders from
 * here immediately and refreshes behind the scenes, instead of showing
 * skeletons and re-running every request from scratch.
 *
 * Module-level rather than React state so it survives unmount, which is the
 * whole point — navigating away and back is the case being fixed. It lives in
 * its own file so the auth provider can clear it without importing the hooks
 * that import the auth provider.
 */
export const queryCache = new Map<string, { data: unknown; at: number }>()

/** How long a cached result is served without a background refresh. */
export const FRESH_MS = 20_000

/** Drops everything; used on sign-out so one member never sees another's data. */
export function clearQueryCache() {
  queryCache.clear()
}

/**
 * Drops cached results for the given query names.
 *
 * Called after a write, so the screen that shows the thing you just changed
 * refetches instead of serving a copy taken before the change.
 */
export function invalidate(...keys: string[]) {
  for (const cacheKey of [...queryCache.keys()]) {
    if (keys.some((k) => cacheKey.startsWith(`${k}|`))) queryCache.delete(cacheKey)
  }
}
