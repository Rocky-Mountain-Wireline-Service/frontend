/**
 * Every GROQ query the site runs, in one place.
 *
 * Images are projected with their asset reference intact rather than resolved
 * to a URL, so `@sanity/image-url` can size and crop them per breakpoint at
 * render time instead of the query committing to one size.
 */

const FIGURE = `{ ..., alt, decorative, asset, crop, hotspot }`;

const SECTIONS = `
  sections[]{
    ...,
    _type == "heroSection" => { heading, intro, cta, secondaryCta, image ${FIGURE} },
    _type == "bodyContent" => { heading, body, imageRight, image ${FIGURE} },
    _type == "linkCardGrid" => {
      heading,
      layout,
      cards[]{ title, body, link, image ${FIGURE} }
    },
    _type == "servicesGrid" => {
      heading,
      intro,
      "services": coalesce(
        services[]->{ _id, title, summary, "slug": slug.current, image ${FIGURE} },
        *[_type == "servicePage"] | order(title asc){ _id, title, summary, "slug": slug.current, image ${FIGURE} }
      )
    },
    _type == "locationsSection" => { heading, locations },
    _type == "statementCards" => {
      heading,
      cards[]{ title, statement, icon ${FIGURE} }
    },
    _type == "logoStrip" => {
      heading,
      logos[]{ name, url, logo{ asset } }
    },
    _type == "contactCards" => {
      heading,
      cards[]{ title, value, href, icon ${FIGURE} }
    },
    _type == "staffDirectory" => { heading, people },
    _type == "mapEmbed" => { heading, embedUrl, label, height },
    _type == "formSection" => {
      heading,
      intro,
      tone,
      "form": form->{ _id, title, "slug": slug.current, active, description, fields, successMessage, spamProtection }
    }
  }
`;

export const PAGE_BY_SLUG = `
  *[_type == "page" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    seo{ ..., image ${FIGURE} },
    ${SECTIONS}
  }
`;

export const SERVICE_BY_SLUG = `
  *[_type == "servicePage" && slug.current == $slug][0]{
    title,
    summary,
    "slug": slug.current,
    content,
    image ${FIGURE},
    seo{ ..., image ${FIGURE} }
  }
`;

export const LEGAL_BY_SLUG = `
  *[_type == "legalPage" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    lastUpdated,
    body,
    seo{ ..., image ${FIGURE} }
  }
`;

/** Header, footer and sitewide settings — everything the layout needs, in one round trip. */
export const SITE_SHELL = `{
  "settings": *[_type == "siteSettings"][0]{
    siteName,
    tagline,
    copyrightText,
    headerCta,
    developerCredit,
    developerUrl,
    logo ${FIGURE},
    mobileLogo ${FIGURE},
    footerLogo ${FIGURE},
    defaultSeo{ ..., image ${FIGURE} }
  },
  "navs": *[_type == "navigation"]{ navType, items[]{ label, href, isExternal } },
  "footer": *[_type == "footerSettings"][0]{
    mission,
    linksHeading,
    contactHeading,
    contactCards{ cards[]{ title, value, href, icon ${FIGURE} } }
  },
  "social": *[_type == "socialLinks"][0].links[]{ platform, url },
  "locations": *[_type == "page"][].sections[][_type == "locationsSection"].locations[]{
    city, state, phone, streetAddress, postalCode
  }
}`;

/** Slugs only — used at build time to enumerate the routes to prerender. */
export const ALL_SERVICE_SLUGS = `*[_type == "servicePage" && defined(slug.current)].slug.current`;
export const ALL_PAGE_SLUGS = `*[_type == "page" && defined(slug.current)].slug.current`;
export const ALL_LEGAL_SLUGS = `*[_type == "legalPage" && defined(slug.current)].slug.current`;
