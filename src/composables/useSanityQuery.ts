import { computed, onMounted, onServerPrefetch, ref, type Ref } from 'vue';
import { sanityFetch, hasSanity } from '@/lib/sanity';
import { useContentStore } from '@/stores/useContentStore';

const keyFor = (query: string, params: Record<string, unknown>) =>
  `${query}::${JSON.stringify(params)}`;

/**
 * Queries already checked against Sanity during this page load. Module state is
 * per visit in the browser, so each query is refetched at most once however
 * many components ask for it (the site shell is used by several) and however
 * often the visitor navigates back to it.
 */
const revalidated = new Set<string>();

/** After the page has settled, so the refetch never competes with the hero image. */
const whenIdle = (task: () => void) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(task, { timeout: 3000 }) : setTimeout(task, 1500);

/**
 * Fetch a GROQ query at build time, then bring it up to date in the browser.
 *
 * The previous implementation fetched in `onMounted`, which only ever runs in
 * the browser — every page shipped an empty shell and filled itself in after a
 * round trip, so crawlers saw nothing. `onServerPrefetch` runs during the
 * prerender, and the store it writes to is serialised into the HTML, so the
 * client normally has the data before it mounts.
 *
 * That baked copy is only as new as the last build, though, and the Studio
 * publishes without one. So once the page has hydrated, a query that came from
 * the build is fetched again from Sanity's CDN and swapped in if it changed:
 * visitors see the latest publish, and a rebuild is only needed for what
 * search engines and link previews read. If the refetch fails or comes back
 * empty, the baked content stays.
 *
 * The `onMounted` path also covers anything not prerendered (a 404 route, or a
 * client-side navigation to a page the build did not cover).
 */
export function useSanityQuery<T>(
  query: string,
  params: Record<string, unknown> = {}
): { data: Ref<T | null>; loading: Ref<boolean> } {
  const store = useContentStore();
  const key = keyFor(query, params);
  const loading = ref(!store.has(key));

  async function load() {
    if (store.has(key)) {
      loading.value = false;
      return;
    }
    store.put(key, await sanityFetch<T>(query, params));
    loading.value = false;
  }

  async function revalidate() {
    const fresh = await sanityFetch<T>(query, params);
    if (fresh === null) return;
    // Only a real change touches the store, so an unchanged page never re-renders.
    if (JSON.stringify(fresh) !== JSON.stringify(store.cache[key])) store.put(key, fresh);
  }

  if (hasSanity) {
    onServerPrefetch(load);
    onMounted(() => {
      if (revalidated.has(key)) return;
      revalidated.add(key);
      // Fetched here for the first time, so it is already current.
      if (!store.has(key)) void load();
      else whenIdle(() => void revalidate());
    });
  } else {
    loading.value = false;
  }

  const data = computed(() => (store.cache[key] ?? null) as T | null);
  return { data, loading };
}
