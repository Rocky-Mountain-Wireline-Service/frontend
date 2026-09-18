import type { Router } from 'vue-router';

/**
 * Google Analytics 4, replacing gatsby-plugin-google-gtag.
 *
 * Two behaviours the Gatsby plugin gave for free and a bare gtag snippet does
 * not:
 *
 *   1. Page views on client-side navigation. gtag only fires automatically on
 *      the initial document load; without this every route after the first
 *      would go uncounted. Automatic sending is turned off and each view is
 *      sent explicitly, so the first load is counted once rather than twice.
 *   2. Do Not Track. The previous config set `respectDNT: true`, so nothing is
 *      loaded at all when the browser asks not to be tracked — no script, no
 *      cookie, no request.
 *
 * The dashboard reads this property through the Analytics Data API; this module
 * is only concerned with collection.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    doNotTrack?: string;
  }
}

function doNotTrackEnabled(): boolean {
  const signals = [
    navigator.doNotTrack,
    window.doNotTrack,
    (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack,
  ];
  return signals.some((s) => s === '1' || s === 'yes');
}

export function initAnalytics(router: Router): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) return;
  if (doNotTrackEnabled()) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // Must forward `arguments` rather than a rest array: gtag.js reads the
    // arguments object itself and a real array is ignored.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  router.afterEach((to) => {
    window.gtag('event', 'page_view', {
      page_path: to.fullPath,
      page_location: window.location.href,
      page_title: document.title,
    });
  });
}
