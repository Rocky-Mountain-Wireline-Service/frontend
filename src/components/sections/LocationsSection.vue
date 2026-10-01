<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue';
import { formatPhone, telHref } from '@/lib/format';
import type { Location } from '@/types/content';

defineProps<{
  section: { heading?: string; locations?: Location[] };
}>();
</script>

<template>
  <!--
    An inset band rather than a full-bleed one. On the live site this block sits
    within the page's gutters, which stops it cutting the page in half and keeps
    it reading as a card of information.

    Navy rather than red: the hero is now a solid red panel, and stacking a
    second red block directly beneath it read as one undifferentiated slab,
    especially on a phone where they fill the screen in sequence. The navy is
    already in the brand kit — the footer's utility bar uses it.
  -->
  <section data-analytics-section="locations" class="px-6 pb-6 pt-10 md:pb-8 md:pt-12">
    <div class="mx-auto max-w-6xl rounded-md bg-[var(--color-band)] px-6 py-10 text-white md:px-12">
      <SectionHeading v-if="section.heading" align="center" invert class="mb-8">
        {{ section.heading }}
      </SectionHeading>

      <ul
        class="flex flex-wrap justify-center gap-x-16 gap-y-8 text-center"
        :class="(section.locations?.length ?? 0) > 3 ? 'sm:gap-x-12' : ''"
      >
        <li v-for="loc in section.locations" :key="`${loc.city}-${loc.state}`">
          <p class="font-[var(--font-heading)] text-lg font-bold">
            {{ loc.city }}, {{ loc.state }}
          </p>
          <p v-if="loc.streetAddress" class="mt-1 text-sm text-white/75">
            {{ loc.streetAddress }}<template v-if="loc.postalCode">, {{ loc.postalCode }}</template>
          </p>
          <a
            v-if="loc.phone"
            :href="telHref(loc.phone)"
            class="focus-ring-light mt-1.5 inline-block font-semibold text-[var(--color-secondary)] underline-offset-4 hover:text-white hover:underline"
          >
            {{ formatPhone(loc.phone) }}
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
