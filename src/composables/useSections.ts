import type { Component } from 'vue';
import HeroSection from '@/components/sections/HeroSection.vue';
import BodyContent from '@/components/sections/BodyContent.vue';
import LinkCardGrid from '@/components/sections/LinkCardGrid.vue';
import ServicesGrid from '@/components/sections/ServicesGrid.vue';
import LocationsSection from '@/components/sections/LocationsSection.vue';
import StatementCards from '@/components/sections/StatementCards.vue';
import LogoStrip from '@/components/sections/LogoStrip.vue';
import ContactCards from '@/components/sections/ContactCards.vue';
import StaffDirectory from '@/components/sections/StaffDirectory.vue';
import FormSection from '@/components/sections/FormSection.vue';

/**
 * Maps a section's `_type` in Sanity to the component that renders it.
 * A type with no entry here is skipped rather than throwing, so adding a
 * section type in the Studio ahead of its component does not break the page.
 */
export const sectionMap: Record<string, Component> = {
  heroSection: HeroSection,
  bodyContent: BodyContent,
  linkCardGrid: LinkCardGrid,
  servicesGrid: ServicesGrid,
  locationsSection: LocationsSection,
  statementCards: StatementCards,
  logoStrip: LogoStrip,
  contactCards: ContactCards,
  staffDirectory: StaffDirectory,
  formSection: FormSection,
};
