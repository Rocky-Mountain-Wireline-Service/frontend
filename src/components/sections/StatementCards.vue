<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import type { Figure, PortableText as PT } from '@/types/content';
import SectionHeading from '@/components/ui/SectionHeading.vue';

defineProps<{
  section: {
    heading?: string;
    cards?: { title: string; statement?: PT; icon?: Figure }[];
  };
}>();
</script>

<template>
  <section class="bg-[var(--color-bg-secondary)] px-6 py-12 md:py-16">
    <div class="mx-auto max-w-5xl">
      <SectionHeading v-if="section.heading" align="center" class="mb-12">{{ section.heading }}</SectionHeading>

      <div class="grid gap-8 md:grid-cols-2">
        <article
          v-for="card in section.cards"
          :key="card.title"
          class="rounded-lg bg-[var(--color-bg-card)] p-7 shadow-sm ring-1 ring-[var(--color-border)] md:p-8"
        >
          <!--
            Icon and title on one line rather than stacked.

            Stacked, the icon floated above the heading with a gap between them
            and read as a third element rather than part of the title. Centring
            it instead would orphan it over left-aligned copy, and centring the
            whole card would turn the gold rule — a left-aligned device
            everywhere else on the site — into something that only behaves this
            way here, while centring five lines of body copy makes it harder to
            scan. Pairing the two keeps one reading line and one alignment.
          -->
          <div class="flex items-center gap-4">
            <SanityImage
              v-if="card.icon?.asset"
              :figure="card.icon"
              :width="96"
              :height="96"
              sizes="48px"
              class-name="h-12 w-12 shrink-0 object-contain"
            />
            <SectionHeading as="h3">{{ card.title }}</SectionHeading>
          </div>
          <div v-if="card.statement?.length" class="prose-body mt-5">
            <PortableText :value="card.statement" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
