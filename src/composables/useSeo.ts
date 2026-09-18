import { useHead } from '@unhead/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://rmws.com';
const siteName = 'Rocky Mountain Wireline Service';
const defaultImage = `${siteUrl}/og-image.png`;

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Home',
    description: 'Rocky Mountain Wireline Service has set the standard in wireline services since 1988. Find a location near you and request a quote.',
  },
  '/about': {
    title: 'About',
    description: 'Providing quality service since 1988 and rivaled by no other competitor. Read the mission and vision behind Rocky Mountain Wireline Service.',
  },
  '/contact': {
    title: 'Contact',
    description: 'Get in touch with Rocky Mountain Wireline Service. Request a quote, reach the branch nearest you, or send us a message and we will follow up.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'Privacy Policy - Rocky Mountain Wireline Service',
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions',
    description: 'Terms & Conditions - Rocky Mountain Wireline Service',
  },
  '/accessibility': {
    title: 'Accessibility Statement',
    description: 'Accessibility Statement - Rocky Mountain Wireline Service',
  },
  '/cookie-policy': {
    title: 'Cookie Policy',
    description: 'Cookie Policy - Rocky Mountain Wireline Service',
  },
  '/services': {
    title: 'Services',
    description: 'Explore the wireline services RMWS provides, delivered by experienced crews through outstanding customer service and constant technological advancement.',
  },
  '/equipment': {
    title: 'Equipment',
    description: 'See the equipment behind Rocky Mountain Wireline Service, trusted by ISN, PEC, and SafeLand USA. Request a quote for your next job.',
  },
  '/safety': {
    title: 'Safety',
    description: 'Committed to safety both off and on the work site, RMWS delivers safe and efficient wireline services and products on every job.',
  },
  '/employment': {
    title: 'Employment',
    description: 'Work with the best. Apply to join the Rocky Mountain Wireline Service team and tell us which branch location and position you are after.',
  },
};

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Rocky Mountain Wireline Service",
  "url": "https://rmws.com",
  "email": "theron.chepko@rmws.com",
  "telephone": "9702701673",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2144 Hwy 6 & 50",
    "addressLocality": "Grand Junction",
    "addressRegion": "CO",
    "postalCode": "81505",
    "addressCountry": "US"
  }
};

export function useSeo() {
  const route = useRoute();

  const meta = computed(() => pageMeta[route.path] || {
    title: siteName,
    description: 'Purpose-driven solutions from ' + siteName + '.',
  });

  const fullTitle = computed(() => {
    const t = meta.value.title;
    return t.includes(siteName) ? t : `${t} | ${siteName}`;
  });

  const canonicalUrl = computed(() => `${siteUrl}${route.path === '/' ? '' : route.path}`);

  useHead({
    title: fullTitle,
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    meta: [
      { name: 'description', content: computed(() => meta.value.description) },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: computed(() => meta.value.description) },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: defaultImage },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: computed(() => meta.value.description) },
      { name: 'twitter:image', content: defaultImage },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schemaJsonLd),
      },
    ],
  });
}
