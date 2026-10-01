<script setup lang="ts">
import { computed } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';
import SectionHeading from '@/components/ui/SectionHeading.vue';
import type { SanityRef } from '@/types/content';

const props = defineProps<{
  section: {
    heading?: string;
    logos?: { name: string; url?: string; logo?: { asset?: SanityRef } }[];
  };
}>();

/**
 * These are accreditation marks, so the organisation name is the alt text —
 * `name` is required in the schema and doubles as the accessible label.
 */
const logos = computed(() =>
  (props.section.logos ?? [])
    .filter((l) => l.logo?.asset)
    .map((l) => ({
      ...l,
      // Requested at 2x the rendered size for high-DPI screens. The current
      // source files are only 200x170, so Sanity cannot deliver more detail
      // than that — see the note on sizing below.
      src: sanityImage(l.logo).width(400).fit('max').auto('format').url(),
    }))
);
</script>

<template>
  <section v-if="logos.length" class="px-6 py-12 md:py-16">
    <div class="mx-auto max-w-5xl text-center">
      <SectionHeading v-if="section.heading" align="center">{{ section.heading }}</SectionHeading>

      <ul class="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-10">
        <li v-for="logo in logos" :key="logo.name">
          <component
            :is="logo.url ? 'a' : 'div'"
            v-bind="logo.url ? { href: logo.url, target: '_blank', rel: 'noopener noreferrer' } : {}"
            :class="logo.url ? 'focus-ring block' : 'block'"
          >
            <!--
              Sized to the largest the current artwork supports. The source
              files are 200x170, so a taller render upscales and a high-DPI
              screen has no extra detail to draw on. Replacing them with SVG or
              a 2x raster is the only way to go bigger cleanly.
            -->
            <img
              :src="logo.src"
              :alt="logo.name"
              loading="lazy"
              decoding="async"
              class="h-28 w-auto object-contain sm:h-36 lg:h-40"
            />
          </component>
        </li>
      </ul>
    </div>
  </section>
</template>
