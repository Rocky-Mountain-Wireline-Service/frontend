import { ViteSSG } from 'vite-ssg';
import { createPinia } from 'pinia';
import App from './App.vue';
import { routes } from './router';
import './assets/styles/main.css';

/**
 * vite-ssg prerenders every route to real HTML at build time and hydrates it in
 * the browser. The template mounted a plain SPA, which meant search engines
 * received an empty shell for a site whose entire purpose is being found.
 */
export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition;
      // Anchors are handled by useHashScroll, which waits for the target to be
      // rendered from CMS data. Returning a position here would scroll to the
      // top before that target exists and fight the composable.
      if (to.hash) return false;
      return { top: 0 };
    },
  },
  ({ app, router, initialState, isClient }) => {
    const pinia = createPinia();
    app.use(pinia);

    // Content fetched during the prerender is serialised into the HTML and
    // restored here, so the browser reuses it instead of refetching.
    if (isClient) {
      pinia.state.value = (initialState.pinia as typeof pinia.state.value) || {};
      // Browser-only: the prerender has no document to attach a script to, and
      // build-time page views would be meaningless anyway.
      void import('./lib/analytics').then(({ initAnalytics }) => initAnalytics(router));
    } else {
      initialState.pinia = pinia.state.value;
    }
  }
);
