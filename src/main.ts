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
      if (to.hash) return { el: to.hash, behavior: 'smooth' };
      return { top: 0 };
    },
  },
  ({ app, initialState, isClient }) => {
    const pinia = createPinia();
    app.use(pinia);

    // Content fetched during the prerender is serialised into the HTML and
    // restored here, so the browser reuses it instead of refetching.
    if (isClient) {
      pinia.state.value = (initialState.pinia as typeof pinia.state.value) || {};
    } else {
      initialState.pinia = pinia.state.value;
    }
  }
);
