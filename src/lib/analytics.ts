import type { Router } from 'vue-router';

/**
 * Google Analytics 4, replacing gatsby-plugin-google-gtag.
 *
 * Page views alone would tell the client how many people visited and almost
 * nothing about whether the site is earning work. For a services business the
 * questions that matter are: how many people asked for a quote, how many picked
 * up the phone, and which services drove them there. Those are the events below.
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

let enabled = false;

function doNotTrackEnabled(): boolean {
  const signals = [
    navigator.doNotTrack,
    window.doNotTrack,
    (navigator as Navigator & { msDoNotTrack?: string }).msDoNotTrack,
  ];
  return signals.some((s) => s === '1' || s === 'yes');
}

/**
 * Send an event. Silently does nothing when analytics never loaded, so callers
 * never have to guard — and a visitor sending Do Not Track stays untracked no
 * matter what a component asks for.
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (!enabled || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

/**
 * A quote request or job application. `generate_lead` is one of GA4's own
 * recommended events, so it can be marked as a key event (conversion) in the
 * GA interface without custom configuration, and it appears in the standard
 * lead-generation reports the client will actually look at.
 */
export function trackLead(formTitle: string, pagePath: string): void {
  track('generate_lead', { form_name: formTitle, page_path: pagePath });
}

/** Someone tried to reach a human. Often more valuable than a form submit. */
export function trackContactClick(method: 'phone' | 'email', context: string): void {
  track('contact_click', { method, link_context: context });
}

/**
 * Where a contact link sits changes what it means: a phone tap on a service
 * page is a warmer signal than one in the footer. The section is derived from
 * the DOM rather than passed by every call site, so links inside CMS body copy
 * are covered too.
 */
function contextOf(el: Element): string {
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  if (el.closest('[data-analytics-section]')) {
    return el.closest('[data-analytics-section]')!.getAttribute('data-analytics-section')!;
  }
  return 'page_body';
}

/**
 * One delegated listener instead of a handler per link.
 *
 * Contact details appear in the header, the footer, contact cards, the staff
 * directory and inside editor-written body copy. Wiring each component would
 * miss the last of those entirely, and would need revisiting every time a
 * section is added.
 */
function trackContactLinks(): void {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href^="tel:"], a[href^="mailto:"]');
      if (!link) return;

      const href = link.getAttribute('href') ?? '';
      trackContactClick(href.startsWith('tel:') ? 'phone' : 'email', contextOf(link));
    },
    // Capture, so the event is recorded even if something later stops propagation.
    { capture: true }
  );
}

/**
 * Buckets a path into a reportable area, so services can be read as one line
 * rather than fifteen.
 */
function contentGroup(path: string): string {
  if (path.startsWith('/services/')) return 'service_detail';
  if (path === '/') return 'home';
  return path.replace(/^\//, '').replace(/-/g, '_');
}

/**
 * Sent by `useSeo` once a page knows its own title, not by a router hook.
 *
 * A router hook fires before the page's content has been fetched, so the title
 * it reads is either the previous page's or the sitewide fallback — every row
 * in GA4 would carry the wrong name. Deferring a frame does not help, because
 * the real title depends on a network round trip, not on rendering.
 */
export function trackPageView(path: string, title: string): void {
  track('page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
    content_group: contentGroup(path),
  });
}

export function initAnalytics(_router: Router): void {
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
  enabled = true;

  trackContactLinks();
}
