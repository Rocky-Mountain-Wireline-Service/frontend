import { createClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'staging';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

export const hasSanity = Boolean(projectId);

/**
 * `useCdn` is off during the build so a deploy never publishes stale content
 * from the CDN's cache, and on in the browser where freshness matters less than
 * latency. In practice the browser rarely queries at all: every route is
 * prerendered and its data arrives hydrated.
 */
export const sanity = hasSanity
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: !import.meta.env.SSR,
      perspective: 'published',
    })
  : null;

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  if (!sanity) return null;
  try {
    return await sanity.fetch<T>(query, params);
  } catch (err) {
    // A failed query must not abort a prerender: the page still renders with
    // whatever else resolved, and the build logs what went missing.
    console.error(`[sanity] query failed: ${(err as Error).message}`);
    return null;
  }
}
