<script setup lang="ts">
import { computed } from 'vue';
import { MapPin, ExternalLink } from 'lucide-vue-next';
import SectionHeading from '@/components/ui/SectionHeading.vue';

const props = defineProps<{
  section: {
    heading?: string;
    embedUrl?: string;
    label?: string;
    address?: string;
    height?: 'short' | 'medium' | 'tall';
  };
}>();

/**
 * The schema restricts which hosts may be embedded, but the frontend checks
 * again rather than trusting it: schema validation is a warning in the Studio,
 * not a guarantee about what is already stored in the dataset.
 */
const ALLOWED_HOSTS = new Set([
  'www.google.com',
  'maps.google.com',
  'google.com',
  'www.openstreetmap.org',
  'openstreetmap.org',
]);

const safeUrl = computed(() => {
  const raw = props.section.embedUrl;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
});

const HEIGHTS = {
  short: 'h-64 sm:h-72',
  medium: 'h-80 sm:h-96',
  tall: 'h-96 sm:h-[32rem]',
} as const;

const heightClass = computed(() => HEIGHTS[props.section.height ?? 'medium']);

/** Opens the native maps app on a phone, which is where directions actually happen. */
const directionsUrl = computed(() =>
  props.section.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.section.address)}`
    : null
);
</script>

<template>
  <section v-if="safeUrl" class="px-6 py-12 md:py-16">
    <div class="mx-auto max-w-6xl">
      <SectionHeading v-if="section.heading" class="mb-8">{{ section.heading }}</SectionHeading>

      <div class="overflow-hidden rounded-md ring-1 ring-[var(--color-border)]">
        <!--
          `loading="lazy"` keeps a third-party frame off the critical path, and
          the restrictive referrerpolicy stops the full page URL being handed to
          the map provider on every view.
        -->
        <iframe
          :src="safeUrl"
          :title="section.label || 'Map'"
          :class="['w-full border-0', heightClass]"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        />
      </div>

      <p
        v-if="section.address"
        class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]"
      >
        <span class="inline-flex items-start gap-2">
          <MapPin :size="16" class="mt-0.5 shrink-0 text-[var(--color-primary-ink)]" aria-hidden="true" />
          <span class="whitespace-pre-line">{{ section.address }}</span>
        </span>
        <a
          v-if="directionsUrl"
          :href="directionsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-ring inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary-ink)] underline-offset-4 hover:underline"
        >
          Get directions
          <ExternalLink :size="14" aria-hidden="true" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </p>
    </div>
  </section>
</template>
