import { useHead } from '@unhead/vue';
import { computed, unref, type MaybeRef } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteShell } from '@/composables/useSiteShell';
import { sanityImage } from '@/composables/useSanityImage';
import type { Figure } from '@/types/content';

const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://rmws.com').replace(/\/$/, '');
const SITE_NAME = 'Rocky Mountain Wireline Service';

export interface SeoInput {
  title?: string;
  description?: string;
  image?: Figure | null;
  noIndex?: boolean;
  /** Used as the title when the document supplies none. */
  fallbackHeading?: string;
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

  const title = computed(() => {
    const t = seo.value.title || seo.value.fallbackHeading;
    if (!t) return SITE_NAME;
    return t.includes(SITE_NAME) ? t : `${t} - ${SITE_NAME}`;
  });

  const description = computed(
    () => seo.value.description || site.defaultSeo?.description || site.tagline || ''
  );

  const canonical = computed(() => `${siteUrl}${route.path === '/' ? '/' : route.path}`);

  const image = computed(() => {
    const figure = seo.value.image ?? site.defaultSeo?.image;
    if (figure?.asset) {
      // Facebook and LinkedIn expect 1200x630 and crop anything else unpredictably.
      return sanityImage(figure).width(1200).height(630).fit('crop').auto('format').url();
    }
    return `${siteUrl}/og-image.png`;
  });

  useHead({
    title,
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { name: 'description', content: description },
      ...(seo.value.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
  });
}

/**
 * Sitewide LocalBusiness data, emitted once from the layout.
 *
 * Branch locations come from the CMS rather than being hardcoded: the previous
 * implementation declared a single address, which told search engines this was
 * a one-office business when it operates several.
 */
export function useOrganizationSchema() {
  const site = useSiteShell();

  useHead({
    script: computed(() => [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.name,
          url: siteUrl,
          ...(site.logo ? { logo: site.logo } : {}),
          ...(site.tagline ? { description: site.tagline } : {}),
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
