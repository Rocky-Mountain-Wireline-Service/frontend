<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import type { Figure, Link, PortableText as PT } from '@/types/content';

withDefaults(
  defineProps<{
    section: {
      heading?: string;
      intro?: PT;
      image?: Figure;
      cta?: Link;
      secondaryCta?: Link;
    };
    /** Interior pages use a shorter band than the homepage. */
    compact?: boolean;
  }>(),
  { compact: false }
);
</script>

<template>
  <section
    class="relative isolate flex items-center overflow-hidden"
    :class="compact ? 'min-h-[42vh] md:min-h-[48vh]' : 'min-h-[68vh] md:min-h-[76vh]'"
  >
    <SanityImage
      v-if="section.image?.asset"
      :figure="section.image"
      :width="1920"
      :height="1080"
      sizes="100vw"
      eager
      class-name="absolute inset-0 -z-20 h-full w-full object-cover"
    />

    <!--
      A left-weighted scrim rather than a flat wash. The live site sets black
      text straight onto the photograph, which reads on the pale cliff face and
      disappears against the truck; a full-strength overlay fixes legibility but
      buries the vehicle, which is the photograph's whole subject. Fading the
      darkness out to the right keeps the text on a solid ground while the truck
      stays visible.
    -->
    <div
      class="absolute inset-0 -z-10"
      :class="
        section.image?.asset
          ? 'bg-gradient-to-r from-black/88 via-black/70 to-black/15'
          : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]'
      "
    />

    <div class="mx-auto w-full max-w-6xl px-6 py-20">
      <div class="max-w-xl">
        <h1
          class="text-balance font-[var(--font-heading)] text-4xl font-bold uppercase leading-[1.08] text-white sm:text-5xl lg:text-[3.25rem]"
        >
          {{ section.heading }}
        </h1>

        <div v-if="section.intro?.length" class="hero-intro mt-5 text-lg leading-relaxed text-white">
          <PortableText :value="section.intro" />
        </div>

        <div v-if="section.cta?.href || section.secondaryCta?.href" class="mt-9 flex flex-wrap gap-4">
          <BaseButton
            v-if="section.cta?.href && section.cta?.label"
            :to="section.cta.href"
            variant="solid"
            size="lg"
            class="focus-ring-light"
          >
            {{ section.cta.label }}
          </BaseButton>
          <BaseButton
            v-if="section.secondaryCta?.href && section.secondaryCta?.label"
            :to="section.secondaryCta.href"
            variant="gold"
            size="lg"
            class="focus-ring-light"
          >
            {{ section.secondaryCta.label }}
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
  The tagline is the first line of the intro copy on the live site, set apart in
  brand gold. Styling the first paragraph rather than adding a CMS field keeps
  it something the client can edit as ordinary text.
*/
.hero-intro :deep(p:first-child) {
  font-family: var(--font-heading);
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-secondary);
  letter-spacing: 0.01em;
  margin-bottom: 0.5rem;
}

.hero-intro :deep(p + p) {
  margin-top: 0.5rem;
}
</style>
