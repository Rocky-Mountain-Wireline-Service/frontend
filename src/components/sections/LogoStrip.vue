<script setup lang="ts">
import { computed } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';
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
      src: sanityImage(l.logo).width(320).fit('max').auto('format').url(),
    }))
);
</script>

<template>
  <section v-if="logos.length" class="px-6 py-14 md:py-16">
    <div class="mx-auto max-w-4xl text-center">
      <h2
        v-if="section.heading"
        class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
      >
        {{ section.heading }}
      </h2>

      <ul class="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        <li v-for="logo in logos" :key="logo.name">
          <component
            :is="logo.url ? 'a' : 'div'"
            v-bind="logo.url ? { href: logo.url, target: '_blank', rel: 'noopener noreferrer' } : {}"
            :class="logo.url ? 'focus-ring block' : 'block'"
          >
            <img
              :src="logo.src"
              :alt="logo.name"
              loading="lazy"
              decoding="async"
              class="h-16 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
            />
          </component>
        </li>
      </ul>
    </div>
  </section>
</template>
