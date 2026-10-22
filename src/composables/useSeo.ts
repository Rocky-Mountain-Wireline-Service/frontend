import { useHead } from '@unhead/vue';
import { computed, unref, watch, type MaybeRef } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteShell } from '@/composables/useSiteShell';
import { sanityImage } from '@/composables/useSanityImage';
import { trackPageView } from '@/lib/analytics';
import type { Figure } from '@/types/content';

const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://rmws.com').replace(/\/$/, '');
const SITE_NAME = 'Rocky Mountain Wireline Service';

/**
 * A build served from a *.netlify.app address is a review copy. Left indexable
 * it would compete with rmws.com as duplicate content, so every page on it is
 * marked noindex. This lifts by itself once the domain is attached.
 */
const IS_PREVIEW = /\.netlify\.app$/.test(new URL(siteUrl).hostname);

export interface SeoInput {
  title?: string;
  description?: string;
  image?: Figure | null;
  noIndex?: boolean;
  /** Used as the title when the document supplies none. */
  fallbackHeading?: string;
  /**
   * False while the page is still fetching. The analytics page view waits for
   * this, so a view is never recorded against a half-resolved title.
   */
  ready?: boolean;
}

/**
 * Head tags for a page, driven by the CMS.
 *
 * The template hardcoded every title and description in a map keyed by path, so
 * the client could not change what their own pages looked like in search
 * results without a code change and a deploy. Those values now live on each
 * document's Search & Social tab, with the site defaults as a fallback.
 */
export function useSeo(input: MaybeRef<SeoInput> = {}) {
  const route = useRoute();
  const site = useSiteShell();

  const seo = computed(() => unref(input));

  /**
   * "Page - Rocky Mountain Wireline Service", or "Page | RMWS" when the full
   * name would push the title past the ~60 characters Google shows. The words
   * people search for come first either way, and RMWS is a name customers
   * already search by.
   */
  const title = computed(() => {
    const t = seo.value.title || seo.value.fallbackHeading;
    if (!t) return SITE_NAME;
    if (t.includes(SITE_NAME) || /\bRMWS\b/.test(t)) return t;
    const full = `${t} - ${SITE_NAME}`;
    return full.length <= 60 ? full : `${t} | RMWS`;
  });

  /**
   * Google shows about 155–160 characters; past that it cuts mid-word. Long
   * descriptions (the service pages derive theirs from a card summary) are
   * trimmed at the last whole word and given an ellipsis instead.
   */
  const description = computed(() => {
    const text = (seo.value.description || site.defaultSeo?.description || site.tagline || '').replace(/\s+/g, ' ').trim();
    if (text.length <= 158) return text;
    const cut = text.slice(0, 155);
    return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.…-]+$/, '')}…`;
  });

  const canonical = computed(() => `${siteUrl}${route.path === '/' ? '/' : route.path}`);

  /**
   * Falls back through the CMS rather than to a bundled file.
   *
   * This previously ended at `/og-image.png`, which was never added to the
   * project — so every page advertised a social image that 404s, and every
   * share rendered with a broken preview. Omitting the tag is better than
   * pointing at nothing: platforms then fall back to their own treatment.
   *
   * Page photos are not used: they come in every size and shape (one service
   * photo is a 439px portrait), and a forced 1200x630 crop of them shared
   * badly. A page shares the branded card unless it sets its own image.
   */
  const image = computed(() => {
    const figure = seo.value.image ?? site.defaultSeo?.image;
    if (!figure?.asset) return '';
    // Facebook and LinkedIn expect 1200x630 and crop anything else unpredictably.
    return sanityImage(figure).width(1200).height(630).fit('crop').auto('format').url();
  });

  // One view per path, sent once the page can name itself.
  let lastTracked = '';
  watch(
    () => [route.fullPath, seo.value.ready !== false, title.value] as const,
    ([path, isReady, resolvedTitle]) => {
      if (!isReady || path === lastTracked) return;
      lastTracked = path;
      trackPageView(path, resolvedTitle);
    },
    { immediate: true, flush: 'post' }
  );

  // `meta` is computed, not a plain array. During the prerender a page's
  // data arrives after this runs; a plain array decided whether to include
  // og:image and robots once, before there was an image to include, so no page
  // ever had a share image.
  useHead({
    title,
    link: [{ rel: 'canonical', href: canonical }],
    meta: computed(() => [
      { name: 'description', content: description.value },
      ...(seo.value.noIndex || IS_PREVIEW ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: title.value },
      { property: 'og:description', content: description.value },
      { property: 'og:url', content: canonical.value },
      // An empty value is dropped by unhead, so no tag is emitted at all.
      ...(image.value ? [{ property: 'og:image', content: image.value }, { property: 'og:image:width', content: '1200' }, { property: 'og:image:height', content: '630' }] : []),
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title.value },
      { name: 'twitter:description', content: description.value },
      ...(image.value ? [{ name: 'twitter:image', content: image.value }] : []),
    ]),
  });
}

/**
 * Sitewide LocalBusiness data, emitted once from the layout.
 *
 * Branch locations come from the CMS rather than being hardcoded: the previous
 * implementation declared a single address, which told search engines this was
 * a one-office business when it operates several.
 */
const STATE_NAMES: Record<string, string> = { CO: 'Colorado', WY: 'Wyoming', UT: 'Utah', ND: 'North Dakota', NM: 'New Mexico', TX: 'Texas', MT: 'Montana' };

export function useOrganizationSchema() {
  const site = useSiteShell();

  // The footer's contact cards hold the main office's phone and email.
  const cardValue = (pattern: RegExp) =>
    site.footerContactCards.find((c) => c.href && pattern.test(c.href))?.value ?? '';
  const mainPhone = computed(() => {
    const digits = cardValue(/^tel:/).replace(/\D/g, '');
    return digits.length === 10 ? `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : '';
  });
  const mainEmail = computed(() => cardValue(/^mailto:/));
  const states = computed(() => [
    ...new Set(site.locations.map((l) => STATE_NAMES[l.state?.toUpperCase()] ?? l.state).filter(Boolean)),
  ]);

  useHead({
    script: computed(() => [
      {
        // The site's name for Google, which shows it above each result. With
        // this in place the full business name appears there even when a
        // page's title ends in the short "| RMWS".
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: site.name,
          alternateName: 'RMWS',
          url: `${siteUrl}/`,
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.name,
          url: siteUrl,
          foundingDate: '1988',
          ...(site.logo ? { logo: site.logo } : {}),
          ...(site.tagline ? { description: site.tagline } : {}),
          ...(mainPhone.value ? { telephone: mainPhone.value } : {}),
          ...(mainEmail.value ? { email: mainEmail.value } : {}),
          // Its social profiles, so search engines can tie them to the business.
          ...(site.socialLinks.length ? { sameAs: site.socialLinks.map((s) => s.url) } : {}),
          ...(states.value.length
            ? { areaServed: states.value.map((name) => ({ '@type': 'State', name })) }
            : {}),
          ...(site.locations.length
            ? {
                location: site.locations.map((loc) => ({
                  '@type': 'LocalBusiness',
                  name: `${site.name} — ${loc.city}`,
                  ...(loc.phone ? { telephone: loc.phone } : {}),
                  address: {
                    '@type': 'PostalAddress',
                    ...(loc.streetAddress ? { streetAddress: loc.streetAddress } : {}),
                    addressLocality: loc.city,
                    addressRegion: loc.state,
                    ...(loc.postalCode ? { postalCode: loc.postalCode } : {}),
                    addressCountry: 'US',
                  },
                })),
              }
            : {}),
        }),
      },
    ]),
  });
}
