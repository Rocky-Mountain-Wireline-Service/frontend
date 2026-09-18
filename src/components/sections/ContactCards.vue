<script setup lang="ts">
import SanityImage from '@/components/ui/SanityImage.vue';
import { formatPhone, isTelHref } from '@/lib/format';
import type { ContactCard } from '@/types/content';

defineProps<{
  section: { heading?: string; cards?: ContactCard[] };
}>();

const display = (card: ContactCard) =>
  isTelHref(card.href) ? formatPhone(card.value) : card.value;
</script>

<template>
  <section data-analytics-section="contact_cards" class="px-6 py-14 md:py-20">
    <div class="mx-auto max-w-5xl">
      <h2 v-if="section.heading" class="mb-10 text-center text-3xl font-bold sm:text-4xl">
        {{ section.heading }}
      </h2>

      <ul class="grid gap-6 sm:grid-cols-3">
        <li
          v-for="card in section.cards"
          :key="card.title"
          class="rounded-lg bg-[var(--color-bg-card)] p-6 text-center shadow-sm ring-1 ring-[var(--color-border)]"
        >
          <SanityImage
            v-if="card.icon?.asset"
            :figure="card.icon"
            :width="56"
            :height="56"
            sizes="56px"
            class-name="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 class="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {{ card.title }}
          </h3>
          <!--
            Only render an anchor when there is somewhere to go. A postal address
            has no useful href, and an <a> without one is not focusable or
            announced as a link.
          -->
          <a
            v-if="card.href"
            :href="card.href"
            class="focus-ring mt-2 block font-medium text-[var(--color-primary-ink)] underline-offset-4 hover:underline"
          >
            {{ display(card) }}
          </a>
          <p v-else class="mt-2 font-medium text-[var(--color-text)]">{{ display(card) }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>
