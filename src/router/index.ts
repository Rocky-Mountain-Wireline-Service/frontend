import type { RouteRecordRaw } from 'vue-router';

const CmsPage = () => import('@/pages/CmsPage.vue');
const ServiceDetail = () => import('@/pages/ServiceDetail.vue');
const LegalPage = () => import('@/pages/LegalPage.vue');
const NotFound = () => import('@/pages/NotFound.vue');

/**
 * The route table only. vite-ssg constructs the router itself — once with a
 * memory history for the prerender, once with a web history in the browser — so
 * calling `createRouter` here would touch `window` during the build.
 */

/**
 * Paths that resolve to a `page` document in Sanity. The slug stored in the CMS
 * is the path itself, which `meta.slug` carries through to the query.
 */
const CMS_PAGES = ['/', '/about', '/services', '/equipment', '/safety', '/employment', '/contact'];

/** Paths that resolve to a `legalPage` document. */
const LEGAL_PAGES = ['/privacy-policy', '/terms-and-conditions'];

export const routes: RouteRecordRaw[] = [
  ...CMS_PAGES.map((path) => ({
    path,
    name: `page:${path}`,
    component: CmsPage,
    meta: { slug: path },
  })),

  {
    path: '/services/:slug',
    name: 'service',
    component: ServiceDetail,
  },

  ...LEGAL_PAGES.map((path) => ({
    path,
    name: `legal:${path}`,
    component: LegalPage,
  })),

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
];
