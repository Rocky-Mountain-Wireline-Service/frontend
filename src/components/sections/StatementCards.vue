<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import type { Figure, PortableText as PT } from '@/types/content';

defineProps<{
  section: {
    heading?: string;
    cards?: { title: string; statement?: PT; icon?: Figure }[];
  };
}>();
</script>

<template>
  <section class="bg-[var(--color-bg-secondary)] px-6 py-16 md:py-24">
    <div class="mx-auto max-w-5xl">
      <h2 v-if="section.heading" class="mb-12 text-center text-3xl font-bold sm:text-4xl">
        {{ section.heading }}
      </h2>

      <div class="grid gap-8 md:grid-cols-2">
        <article
          v-for="card in section.cards"
          :key="card.title"
          class="rounded-lg bg-[var(--color-bg-card)] p-8 shadow-sm ring-1 ring-[var(--color-border)]"
        >
          <SanityImage
            v-if="card.icon?.asset"
            :figure="card.icon"
            :width="72"
            :height="72"
            sizes="72px"
            class-name="mb-5 h-16 w-16 object-contain"
          />
          <h3 class="text-xl font-bold text-[var(--color-primary-ink)]">{{ card.title }}</h3>
          <div v-if="card.statement?.length" class="prose-body mt-4">
            <PortableText :value="card.statement" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
