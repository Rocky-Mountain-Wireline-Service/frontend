<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import type { Figure, PortableText as PT } from '@/types/content';

const props = defineProps<{
  section: {
    heading?: string;
    body?: PT;
    image?: Figure;
    imageRight?: boolean;
  };
}>();

const hasImage = () => Boolean(props.section.image?.asset);
</script>

<template>
  <section class="px-6 py-16 md:py-24">
    <div
      class="mx-auto grid max-w-6xl items-center gap-10 lg:gap-16"
      :class="hasImage() ? 'lg:grid-cols-2' : 'max-w-3xl'"
    >
      <!--
        `order-last` only applies from `lg` up, so on narrow screens the image
        always precedes the text regardless of which side it sits on at desktop.
      -->
      <SanityImage
        v-if="hasImage()"
        :figure="section.image"
        :width="960"
        sizes="(min-width: 1024px) 50vw, 100vw"
        :class-name="[
          'w-full rounded-lg shadow-lg',
          section.imageRight ? 'lg:order-last' : '',
        ].join(' ')"
      />

      <div>
        <h2
          v-if="section.heading"
          class="text-balance text-3xl font-bold text-[var(--color-text)] sm:text-4xl"
        >
          {{ section.heading }}
        </h2>
        <div class="prose-body" :class="section.heading ? 'mt-6' : ''">
          <PortableText v-if="section.body?.length" :value="section.body" />
        </div>
      </div>
    </div>
  </section>
</template>
