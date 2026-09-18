<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import type { Figure, Link, PortableText as PT } from '@/types/content';

defineProps<{
  section: {
    heading?: string;
    intro?: PT;
    image?: Figure;
    cta?: Link;
  };
}>();
</script>

<template>
  <section class="relative isolate flex min-h-[60vh] items-center overflow-hidden md:min-h-[70vh]">
    <!--
      The image is a real <img> rather than a CSS background so it participates
      in srcset and can be the LCP element the browser prioritises. The old site
      used a fixed-position background that shipped one 1920px file to phones.
    -->
    <SanityImage
      v-if="section.image?.asset"
      :figure="section.image"
      :width="1920"
      :height="1080"
      sizes="100vw"
      eager
      class-name="absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div
      class="absolute inset-0 -z-10"
      :class="
        section.image?.asset
          ? 'bg-gradient-to-br from-black/75 via-black/55 to-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]'
          : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]'
      "
    />

    <div class="mx-auto w-full max-w-5xl px-6 py-24 text-white">
      <h1 class="max-w-3xl text-balance text-4xl font-bold leading-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
        {{ section.heading }}
      </h1>

      <div
        v-if="section.intro?.length"
        class="hero-intro mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl"
      >
        <PortableText :value="section.intro" />
      </div>

      <SmartLink
        v-if="section.cta?.href && section.cta?.label"
        :to="section.cta.href"
        class="focus-ring-light mt-10 inline-flex items-center rounded-md bg-[var(--color-secondary)] px-8 py-3.5 font-semibold text-[color:#1a1a1a] transition-colors hover:bg-white"
      >
        {{ section.cta.label }}
      </SmartLink>
    </div>
  </section>
</template>

<style scoped>
.hero-intro :deep(p + p) {
  margin-top: 1rem;
}
</style>
