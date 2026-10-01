<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import type { Figure, Link, PortableText as PT } from '@/types/content';

const props = withDefaults(
  defineProps<{
    section: {
      heading?: string;
      intro?: PT;
      image?: Figure;
      cta?: Link;
      secondaryCta?: Link;
    };
    /**
     * auto    — panel when the hero has copy to hold, otherwise overlay
     * panel   — text in a solid brand block beside the photograph
     * overlay — text over the photograph behind a scrim
     */
    variant?: 'auto' | 'panel' | 'overlay';
  }>(),
  { variant: 'auto' }
);

/**
 * The panel exists to hold content. Interior pages carry a heading and nothing
 * else, so a panel there is an empty red rectangle sitting between the page's
 * hero photograph and the page's first content image — two photographs with a
 * near-blank block wedged between them, which on a phone is most of the first
 * screen. Those pages get the overlay instead, which is a single band.
 */
const hasSubstance = computed(() =>
  Boolean(props.section.intro?.length || props.section.cta?.href || props.section.secondaryCta?.href)
);

const resolved = computed<'panel' | 'overlay'>(() => {
  if (props.variant !== 'auto') return props.variant;
  return hasSubstance.value && props.section.image?.asset ? 'panel' : 'overlay';
});

/** A title-only hero does not need to fill the viewport to do its job. */
const compact = computed(() => !hasSubstance.value);
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
    v-if="resolved === 'panel'"
    class="relative isolate grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
  >
    <div
      class="order-2 flex items-center bg-[var(--color-primary)] px-6 py-10 text-white sm:py-12 lg:order-1 lg:px-12 lg:py-20 xl:px-16"
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

        <div
          v-if="section.cta?.href || section.secondaryCta?.href"
          class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <BaseButton
            v-if="section.cta?.href && section.cta?.label"
            :to="section.cta.href"
            variant="gold"
            size="lg"
            class="focus-ring-light w-full sm:w-auto"
          >
            {{ section.cta.label }}
          </BaseButton>
          <BaseButton
            v-if="section.secondaryCta?.href && section.secondaryCta?.label"
            :to="section.secondaryCta.href"
            variant="light"
            size="lg"
            class="focus-ring-light w-full sm:w-auto"
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
        class-name="aspect-[4/3] max-h-80 w-full object-cover sm:aspect-[16/9] sm:max-h-96 lg:aspect-auto lg:h-full lg:max-h-none lg:min-h-[34rem]"
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
