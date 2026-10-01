/** Shapes returned by the GROQ queries in `lib/queries.ts`. */

export interface SanityRef {
  _ref: string;
  _type: 'reference';
}

export interface Figure {
  asset?: SanityRef;
  alt?: string;
  decorative?: boolean;
  crop?: unknown;
  hotspot?: unknown;
}

/**
 * Portable Text is passed straight through to @portabletext/vue, whose
 * `TypedObject` requires `_type` — so this must declare it rather than widening
 * to Record<string, unknown>, which would not assign.
 */
export interface PortableTextBlock {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}
export type PortableText = PortableTextBlock[];

export interface Link {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface Seo {
  title?: string;
  description?: string;
  image?: Figure;
  noIndex?: boolean;
}

export interface Section {
  _key: string;
  _type: string;
  [key: string]: unknown;
}

export interface Page {
  title: string;
  slug: string;
  seo?: Seo;
  sections?: Section[];
}

export interface ServicePage {
  title: string;
  slug: string;
  summary?: string;
  content?: PortableText;
  image?: Figure;
  seo?: Seo;
}

export interface LegalPage {
  title: string;
  slug: string;
  lastUpdated?: string;
  body?: PortableText;
  seo?: Seo;
}

export interface Location {
  city: string;
  state: string;
  phone: string;
  streetAddress?: string;
  postalCode?: string;
}

export interface FormField {
  _key: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

export interface DynamicForm {
  _id: string;
  title: string;
  slug: string;
  active?: boolean;
  description?: string;
  fields?: FormField[];
  successMessage?: string;
  spamProtection?: { honeypot?: boolean; minimumSeconds?: number };
}

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  copyrightText?: string;
  headerCta?: Link;
  developerCredit?: string;
  developerUrl?: string;
  logo?: Figure;
  mobileLogo?: Figure;
  footerLogo?: Figure;
  defaultSeo?: Seo;
}

export interface ContactCard {
  title: string;
  value: string;
  href?: string;
  icon?: Figure;
}

export interface SiteShell {
  settings?: SiteSettings;
  navs?: { navType: string; items?: Link[] }[];
  footer?: {
    mission?: PortableText;
    linksHeading?: string;
    contactHeading?: string;
    contactCards?: { cards?: ContactCard[] };
  };
  social?: { platform: string; url: string }[];
  locations?: Location[];
}
