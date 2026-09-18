import { defineStore } from 'pinia';

/**
 * Query results, keyed by query + params.
 *
 * vite-ssg serialises this store into the prerendered HTML and Pinia rehydrates
 * it on the client, so content fetched once at build time is reused by the
 * browser rather than refetched. That is what lets a page render its real
 * content in the served HTML instead of after a round trip.
 */
export const useContentStore = defineStore('content', {
  state: () => ({
    cache: {} as Record<string, unknown>,
  }),
  actions: {
    has(key: string) {
      return Object.prototype.hasOwnProperty.call(this.cache, key);
    },
    put(key: string, value: unknown) {
      this.cache[key] = value;
    },
  },
});
