/// <reference types="vite-ssg" />
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // Vite exposes .env to client code as `import.meta.env`, but the SSG hooks
  // below run in plain Node, where only `process.env` exists. Without this the
  // build-time Sanity queries silently find no credentials and prerender zero
  // service pages.
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'VITE_'));

  // Netlify sets URL to the site's primary address: the *.netlify.app name
  // until a custom domain is attached, the domain afterwards. Following it
  // keeps canonicals, og:url and the sitemap pointing at wherever this build
  // is actually served, with no variable to remember to change at launch.
  process.env.VITE_SITE_URL ||= process.env.URL || 'https://rmws.com';

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      // Routes come from the CMS, not the file system: service detail pages
      // only exist because a `servicePage` document does.
      includedRoutes: async (paths: string[]) => {
        const { getPrerenderRoutes } = await import('./build/prerender');
        return getPrerenderRoutes(paths);
      },
      onFinished: async () => {
        const { writeSitemap } = await import('./build/prerender');
        await writeSitemap();
      },
    },
  };
});
