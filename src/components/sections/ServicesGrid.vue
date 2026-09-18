<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import { RouterLink } from 'vue-router';
import { ArrowRight } from 'lucide-vue-next';
import type { Figure, PortableText as PT } from '@/types/content';

defineProps<{
  section: {
    heading?: string;
    intro?: PT;
    services?: { _id: string; title: string; slug: string; summary?: string; image?: Figure }[];
  };
}>();
</script>

<template>
  <section class="px-6 py-16 md:py-24">
    <div class="mx-auto max-w-6xl">
      <h2
        v-if="section.heading"
        class="text-balance text-center text-3xl font-bold sm:text-4xl"
      >
        {{ section.heading }}
      </h2>
      <div
        v-if="section.intro?.length"
        class="prose-body mx-auto mt-4 max-w-2xl text-center"
      >
        <PortableText :value="section.intro" />
      </div>

      <ul class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="service in section.services" :key="service._id" class="group">
          <RouterLink
            :to="`/services/${service.slug}`"
            class="focus-ring flex h-full flex-col overflow-hidden rounded-lg bg-[var(--color-bg-card)] shadow-sm ring-1 ring-[var(--color-border)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="aspect-[3/2] overflow-hidden bg-[var(--color-bg-tertiary)]">
              <SanityImage
                v-if="service.image?.asset"
                :figure="service.image"
                :width="640"
                :height="427"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                class-name="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div class="flex flex-1 flex-col p-6">
              <h3 class="text-lg font-semibold">{{ service.title }}</h3>
              <p v-if="service.summary" class="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {{ service.summary }}
              </p>
              <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                Learn more
                <ArrowRight :size="16" class="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
