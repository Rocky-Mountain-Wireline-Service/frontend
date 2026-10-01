import { computed, reactive } from 'vue';
import { useSanityQuery } from '@/composables/useSanityQuery';
import { sanityImage } from '@/composables/useSanityImage';
import { SITE_SHELL } from '@/lib/queries';
import type { ContactCard, Figure, Link, Location, PortableText, Seo, SiteShell } from '@/types/content';

const FALLBACK_NAME = 'Rocky Mountain Wireline Service';

const url = (figure?: Figure | null, width = 400) =>
  figure?.asset ? sanityImage(figure).width(width).auto('format').url() : '';

/**
 * Sitewide content — header, footer, settings — derived straight from the query.
 *
 * Everything here is a `computed` over the cached result rather than state
 * copied into a store by a watcher. Vue does not re-run watchers reactively
 * during SSR, so a watcher-based sync left the store at its defaults and
 * prerendered an empty header and footer while looking correct in the browser.
 * Computeds evaluate at render time, so the prerender and the client agree.
 *
 * Calling this from several components costs one request: `useSanityQuery`
 * caches on the query itself, and the later callers read the same entry.
 *
 * Returned as a `reactive` object rather than a bag of refs: Vue only unwraps
 * refs that are top-level setup bindings, so `site.logo` in a template would
 * otherwise render "[object Object]". `reactive` unwraps on property access, in
 * both templates and script.
 */
export function useSiteShell() {
  const { data } = useSanityQuery<SiteShell>(SITE_SHELL);

  const settings = computed(() => data.value?.settings ?? null);

  const navOf = (type: string) =>
    computed<Link[]>(
      () => data.value?.navs?.find((n) => n.navType === type)?.items ?? []
    );

  return reactive({
    name: computed(() => settings.value?.siteName || FALLBACK_NAME),
    tagline: computed(() => settings.value?.tagline ?? ''),
    copyrightText: computed(() => settings.value?.copyrightText ?? ''),

    /**
     * The header button. Defaults point at the contact form's anchor so the
     * visitor lands on the form itself rather than the top of the page.
     */
    headerCta: computed<Link>(() => ({
      label: settings.value?.headerCta?.label || 'Contact Sales',
      href: settings.value?.headerCta?.href || '/contact#contact-form',
    })),
    developerCredit: computed(() => settings.value?.developerCredit ?? ''),
    developerUrl: computed(() => settings.value?.developerUrl ?? ''),

    logo: computed(() => url(settings.value?.logo)),
    logoAlt: computed(() => settings.value?.logo?.alt || settings.value?.siteName || FALLBACK_NAME),
    footerLogo: computed(() => url(settings.value?.footerLogo) || url(settings.value?.logo)),
    footerLogoAlt: computed(
      () => settings.value?.footerLogo?.alt || settings.value?.logo?.alt || FALLBACK_NAME
    ),

    defaultSeo: computed<Seo | null>(() => settings.value?.defaultSeo ?? null),

    primaryNav: navOf('main'),
    footerNav: navOf('footer'),
    legalNav: navOf('legal'),

    footerMission: computed<PortableText | null>(() => data.value?.footer?.mission ?? null),
    footerLinksHeading: computed(() => data.value?.footer?.linksHeading || 'Quick Links'),
    footerContactHeading: computed(() => data.value?.footer?.contactHeading || 'Contact'),
    footerContactCards: computed<ContactCard[]>(
      () => data.value?.footer?.contactCards?.cards ?? []
    ),

    socialLinks: computed(() => data.value?.social ?? []),
    locations: computed<Location[]>(() => data.value?.locations ?? []),
  });
}
