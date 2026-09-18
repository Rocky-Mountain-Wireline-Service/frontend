<script setup lang="ts">
import { Mail, Phone, MapPin } from 'lucide-vue-next';

interface Person {
  name: string;
  jobTitle?: string;
  department?: string;
  region?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  cityState?: string;
}

defineProps<{
  section: { heading?: string; people?: Person[] };
}>();

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : phone;
}

/**
 * The legacy data stored a hand-written DOM id per person. Deriving the anchor
 * from the name instead keeps deep links working without a field the client has
 * to maintain and never sees rendered.
 */
const anchorId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
</script>

<template>
  <section class="bg-[var(--color-bg-secondary)] px-6 py-16 md:py-24">
    <div class="mx-auto max-w-6xl">
      <h2 v-if="section.heading" class="mb-12 text-center text-3xl font-bold sm:text-4xl">
        {{ section.heading }}
      </h2>

      <ul class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="person in section.people"
          :id="anchorId(person.name)"
          :key="person.name"
          class="flex flex-col rounded-lg bg-[var(--color-bg-card)] p-6 shadow-sm ring-1 ring-[var(--color-border)]"
        >
          <h3 class="text-lg font-bold">{{ person.name }}</h3>
          <p v-if="person.jobTitle" class="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {{ person.jobTitle }}
          </p>
          <p
            v-if="person.region"
            class="mt-2 inline-flex w-fit rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]"
          >
            {{ person.region }}
          </p>

          <dl class="mt-4 space-y-2 text-sm">
            <div v-if="person.email" class="flex items-center gap-2">
              <dt class="sr-only">Email</dt>
              <Mail :size="15" class="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <dd class="min-w-0">
                <a
                  :href="`mailto:${person.email}`"
                  class="focus-ring block truncate text-[var(--color-primary)] underline-offset-4 hover:underline"
                >
                  {{ person.email }}
                </a>
              </dd>
            </div>

            <div v-if="person.phone" class="flex items-center gap-2">
              <dt class="sr-only">Phone</dt>
              <Phone :size="15" class="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <dd>
                <a
                  :href="telHref(person.phone)"
                  class="focus-ring text-[var(--color-primary)] underline-offset-4 hover:underline"
                >
                  {{ formatPhone(person.phone) }}
                </a>
              </dd>
            </div>

            <div v-if="person.streetAddress || person.cityState" class="flex items-start gap-2">
              <dt class="sr-only">Address</dt>
              <MapPin :size="15" class="mt-0.5 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
              <dd class="text-[var(--color-text-secondary)]">
                <span v-if="person.streetAddress">{{ person.streetAddress }}</span>
                <span v-if="person.streetAddress && person.cityState"><br /></span>
                <span v-if="person.cityState">{{ person.cityState }}</span>
              </dd>
            </div>
          </dl>
        </li>
      </ul>
    </div>
  </section>
</template>
