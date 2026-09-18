import { defineStore } from 'pinia';
import type { SiteConfig } from '@/types/site';

export const useSiteStore = defineStore('site', {
  state: (): SiteConfig => ({
    name: 'Rocky Mountain Wireline Service',
    logo: '',
    darkLogo: '',
    tagline: '',
    contactEmail: 'theron.chepko@rmws.com',
    contactPhone: '',
    address: '',
    ctaLabel: '',
    ctaUrl: '/contact',
    ctaHeadline: 'Ready to get started?',
    ctaSubtext: 'Let\'s build something great together.',
    ctaFooterLabel: '',
    ctaFooterUrl: '',
    copyrightText: '',
    primaryNav: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Services', to: '/services' },
      { label: 'Equipment', to: '/equipment' },
      { label: 'Safety', to: '/safety' },
      { label: 'Employment', to: '/employment' },
    ],
    footerNav: [],
    legalNav: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Accessibility Statement', to: '/accessibility' },
      { label: 'Cookie Policy', to: '/cookie-policy' },
    ],
    socialLinks: [],
  }),
});
