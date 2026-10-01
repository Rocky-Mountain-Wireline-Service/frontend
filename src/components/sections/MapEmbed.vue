<script setup lang="ts">
import { computed } from 'vue';
import SectionHeading from '@/components/ui/SectionHeading.vue';

const props = defineProps<{
  section: {
    heading?: string;
    embedUrl?: string;
    label?: string;
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
  short: 'h-72 sm:h-80',
  medium: 'h-80 sm:h-[26rem]',
  tall: 'h-96 sm:h-[34rem]',
} as const;

const heightClass = computed(() => HEIGHTS[props.section.height ?? 'medium']);
</script>

<template>
  <!--
    No bottom padding: the map runs full-bleed into the footer, so the page ends
    on the map rather than on a strip of background between the two.
  -->
  <section v-if="safeUrl" class="pt-12 md:pt-16">
    <div v-if="section.heading" class="mx-auto mb-8 max-w-6xl px-6">
      <SectionHeading>{{ section.heading }}</SectionHeading>
    </div>

    <!--
      `block` matters here. An iframe is inline by default, so it sits on a text
      baseline and leaves a few pixels of descender gap underneath — which is
      exactly the seam this layout is trying to avoid.
    -->
    <iframe
      :src="safeUrl"
      :title="section.label || 'Map'"
      :class="['block w-full border-0', heightClass]"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    />
  </section>
</template>
