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
    /**
     * panel   — text in a solid brand block beside the photograph
     * overlay — text over the photograph behind a scrim
     */
    variant?: 'panel' | 'overlay';
    /** Interior pages use a shorter band than the homepage. */
    compact?: boolean;
  }>(),
  { variant: 'panel', compact: false }
);
</script>

<template>
  <!--
    Panel: the copy sits on solid brand red beside the photograph rather than on
    top of it.

    Text over a photograph is always a compromise — the live site sets black
    type straight onto the image, which disappears against the truck, and the
    scrim that fixes legibility buries the vehicle the photograph exists to
    show. Moving the text beside the image removes the conflict: the type gets a
    controlled ground at full contrast, and the photograph is never darkened.
    The red block also repeats the locations band, so the page opens on brand
    rather than on a wash of grey.
  -->
  <section
    v-if="variant === 'panel' && section.image?.asset"
    class="relative isolate grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
  >
    <div
      class="order-2 flex items-center bg-[var(--color-primary)] px-6 py-14 text-white lg:order-1 lg:px-12 lg:py-20 xl:px-16"
    >
      <div class="mx-auto w-full max-w-lg lg:mx-0 lg:ml-auto">
        <h1
          class="text-balance font-[var(--font-heading)] text-3xl font-bold uppercase leading-[1.1] sm:text-4xl lg:text-[2.85rem]"
        >
          {{ section.heading }}
        </h1>

        <div v-if="section.intro?.length" class="hero-intro mt-5 leading-relaxed text-white">
          <PortableText :value="section.intro" />
        </div>

        <div v-if="section.cta?.href || section.secondaryCta?.href" class="mt-8 flex flex-wrap gap-3">
          <BaseButton
            v-if="section.cta?.href && section.cta?.label"
            :to="section.cta.href"
            variant="gold"
            size="lg"
            class="focus-ring-light"
          >
            {{ section.cta.label }}
          </BaseButton>
          <BaseButton
            v-if="section.secondaryCta?.href && section.secondaryCta?.label"
            :to="section.secondaryCta.href"
            variant="light"
            size="lg"
            class="focus-ring-light"
          >
            {{ section.secondaryCta.label }}
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="order-1 lg:order-2">
      <SanityImage
        :figure="section.image"
        :width="1400"
        :height="1000"
        sizes="(min-width: 1024px) 55vw, 100vw"
        eager
        class-name="h-56 w-full object-cover sm:h-80 lg:h-full lg:min-h-[34rem]"
      />
    </div>
  </section>

  <!-- Overlay: a single band with the copy over a left-weighted scrim. -->
  <section
    v-else
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
  font-size: 1.3125rem;
  font-weight: 700;
  color: var(--color-secondary);
  letter-spacing: 0.01em;
  margin-bottom: 0.5rem;
}

.hero-intro :deep(p + p) {
  margin-top: 0.5rem;
}
</style>
