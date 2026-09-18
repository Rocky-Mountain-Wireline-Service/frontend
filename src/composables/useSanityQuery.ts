import { computed, onMounted, onServerPrefetch, ref, type Ref } from 'vue';
import { sanityFetch, hasSanity } from '@/lib/sanity';
import { useContentStore } from '@/stores/useContentStore';

const keyFor = (query: string, params: Record<string, unknown>) =>
  `${query}::${JSON.stringify(params)}`;

/**
 * Fetch a GROQ query once, at build time where possible.
 *
 * The previous implementation fetched in `onMounted`, which only ever runs in
 * the browser — every page shipped an empty shell and filled itself in after a
 * round trip, so crawlers saw nothing. `onServerPrefetch` runs during the
 * prerender, and the store it writes to is serialised into the HTML, so the
 * client normally has the data before it mounts.
 *
 * The `onMounted` path remains as a fallback for anything not prerendered
 * (a 404 route, or a client-side navigation to a page the build did not cover).
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

  if (hasSanity) {
    onServerPrefetch(load);
    onMounted(() => {
      if (!store.has(key)) void load();
    });
  } else {
    loading.value = false;
  }

  const data = computed(() => (store.cache[key] ?? null) as T | null);
  return { data, loading };
}
