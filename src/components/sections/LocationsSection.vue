<script setup lang="ts">
import { Phone, MapPin } from 'lucide-vue-next';
import type { Location } from '@/types/content';
import { formatPhone, telHref } from '@/lib/format';

defineProps<{
  section: { heading?: string; locations?: Location[] };
}>();


</script>

<template>
  <section class="bg-[var(--color-primary)] px-6 py-16 text-white md:py-20">
    <div class="mx-auto max-w-5xl">
      <h2 v-if="section.heading" class="text-center text-3xl font-bold sm:text-4xl">
        {{ section.heading }}
      </h2>

      <ul class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="loc in section.locations"
          :key="`${loc.city}-${loc.state}`"
          class="rounded-lg bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-sm"
        >
          <p class="flex items-start gap-2 text-lg font-semibold">
            <MapPin :size="20" class="mt-0.5 shrink-0 text-[var(--color-secondary)]" aria-hidden="true" />
            <span>
              {{ loc.city }}, {{ loc.state }}
              <span v-if="loc.streetAddress" class="mt-1 block text-sm font-normal text-white/75">
                {{ loc.streetAddress }}<template v-if="loc.postalCode">, {{ loc.postalCode }}</template>
              </span>
            </span>
          </p>
          <a
            v-if="loc.phone"
            :href="telHref(loc.phone)"
            class="focus-ring-light mt-4 inline-flex items-center gap-2 font-medium text-white underline-offset-4 hover:text-[var(--color-secondary)] hover:underline"
          >
            <Phone :size="16" aria-hidden="true" />
            <span>{{ formatPhone(loc.phone) }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
