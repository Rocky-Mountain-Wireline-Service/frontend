<script setup lang="ts">
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import SectionHeading from '@/components/ui/SectionHeading.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import SmartLink from '@/components/ui/SmartLink.vue';
import { ArrowRight } from 'lucide-vue-next';
import type { Figure, Link, PortableText as PT } from '@/types/content';

withDefaults(
  defineProps<{
    section: {
      heading?: string;
      layout?: 'rows' | 'cards';
      cards?: { title: string; body?: PT; image?: Figure; link: Link }[];
    };
  }>(),
  {}
);
</script>

<template>
  <section class="px-6 py-12 md:py-16">
    <div class="mx-auto max-w-6xl">
      <SectionHeading v-if="section.heading" class="mb-12">{{ section.heading }}</SectionHeading>

      <!--
        Alternating rows, the live site's layout for this content.

        These entries carry three or four paragraphs each. In a four-up card
        grid the columns ran to wildly different heights and the copy was
        squeezed into a ~200px measure — unreadable, and it made the longest
        entry look like a mistake. Rows give the text a proper measure and the
        photographs the size they deserve.
      -->
      <div v-if="section.layout !== 'cards'" class="space-y-12 md:space-y-16">
        <article
          v-for="(card, i) in section.cards"
          :key="card.title"
          class="grid items-center gap-7 md:grid-cols-2 md:gap-12"
        >
          <SanityImage
            v-if="card.image?.asset"
            :figure="card.image"
            :width="960"
            :height="680"
            sizes="(min-width: 768px) 50vw, 100vw"
            :class-name="[
              'aspect-[4/3] w-full object-cover',
              // Odd rows put the image on the right, but only once there are two
              // columns — stacked, the image always leads.
              i % 2 === 1 ? 'md:order-last' : '',
            ].join(' ')"
          />

          <div>
            <SectionHeading as="h3">{{ card.title }}</SectionHeading>
            <div v-if="card.body?.length" class="prose-body mt-5">
              <PortableText :value="card.body" />
            </div>
            <BaseButton
              v-if="card.link?.href"
              :to="card.link.href"
              variant="outline"
              class="focus-ring mt-7"
            >
              Read More
            </BaseButton>
          </div>
        </article>
      </div>

      <!-- Card layout, for sections with many short entries. -->
      <ul v-else class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="card in section.cards" :key="card.title" class="group">
          <SmartLink
            :to="card.link.href"
            class="focus-ring flex h-full flex-col overflow-hidden rounded-md bg-[var(--color-bg-card)] shadow-sm ring-1 ring-[var(--color-border)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
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
              <h3 class="font-[var(--font-heading)] text-base font-bold uppercase leading-snug text-[var(--color-heading)]">
                {{ card.title }}
              </h3>
              <div v-if="card.body?.length" class="prose-body mt-3 line-clamp-4 flex-1 text-sm">
                <PortableText :value="card.body" />
              </div>
              <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-ink)]">
                Read More
                <ArrowRight :size="16" class="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </SmartLink>
        </li>
      </ul>
    </div>
  </section>
</template>
