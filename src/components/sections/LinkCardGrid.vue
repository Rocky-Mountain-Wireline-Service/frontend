<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import { ArrowRight } from 'lucide-vue-next';
import type { Figure, Link, PortableText as PT } from '@/types/content';

defineProps<{
  section: {
    heading?: string;
    cards?: { title: string; body?: PT; image?: Figure; link: Link }[];
  };
}>();
</script>

<template>
  <section class="bg-[var(--color-bg-secondary)] px-6 py-16 md:py-24">
    <div class="mx-auto max-w-6xl">
      <h2
        v-if="section.heading"
        class="mb-12 text-balance text-center text-3xl font-bold sm:text-4xl"
      >
        {{ section.heading }}
      </h2>

      <ul class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="card in section.cards" :key="card.title" class="group">
          <!--
            The whole card is one link, so there is a single tab stop and one
            accessible name per card rather than an image link and a text link
            pointing at the same place.
          -->
          <SmartLink
            :to="card.link.href"
            class="focus-ring flex h-full flex-col overflow-hidden rounded-lg bg-[var(--color-bg-card)] shadow-sm ring-1 ring-[var(--color-border)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="aspect-[4/3] overflow-hidden bg-[var(--color-bg-tertiary)]">
              <SanityImage
                v-if="card.image?.asset"
                :figure="card.image"
                :width="640"
                :height="480"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                class-name="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div class="flex flex-1 flex-col p-6">
              <h3 class="text-lg font-semibold text-[var(--color-text)]">
                {{ card.title }}
              </h3>
              <div v-if="card.body?.length" class="prose-body mt-3 flex-1 text-sm">
                <PortableText :value="card.body" />
              </div>
              <span
                class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]"
              >
                {{ card.link.label }}
                <ArrowRight :size="16" class="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </SmartLink>
        </li>
      </ul>
    </div>
  </section>
</template>
