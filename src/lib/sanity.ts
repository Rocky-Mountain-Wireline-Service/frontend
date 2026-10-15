const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'staging';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

export const hasSanity = Boolean(projectId);

/**
 * GROQ over plain HTTP rather than through @sanity/client.
 *
 * The site only ever reads published documents by query, which is one GET
 * request. The client library did the same thing for roughly a third of the
 * JavaScript every visitor downloaded — and on a phone that download was
 * competing with the hero photograph for bandwidth.
 *
 * The CDN host is used in the browser and the live API during the build, so a
 * deploy never publishes content the CDN has not caught up with yet. In
 * practice the browser rarely queries at all: every route is prerendered and
 * its data arrives hydrated.
 */
const host = import.meta.env.SSR ? 'api.sanity.io' : 'apicdn.sanity.io';

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  if (!hasSanity) return null;

  const search = new URLSearchParams({ query, perspective: 'published' });
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value));

  try {
    const res = await fetch(`https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?${search}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return ((await res.json()) as { result: T }).result ?? null;
  } catch (err) {
    // A failed query must not abort a prerender: the page still renders with
    // whatever else resolved, and the build logs what went missing.
    console.error(`[sanity] query failed: ${(err as Error).message}`);
    return null;
  }
}
