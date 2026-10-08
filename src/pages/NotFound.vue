<script setup lang="ts">
import { useSiteShell } from '@/composables/useSiteShell';
import { useSeo } from '@/composables/useSeo';
import BaseButton from '@/components/ui/BaseButton.vue';
import SectionHeading from '@/components/ui/SectionHeading.vue';
import SmartLink from '@/components/ui/SmartLink.vue';

const site = useSiteShell();

// A missing page must not be indexed under whatever URL was mistyped.
useSeo({
  title: 'Page Not Found',
  description:
    'The page you are looking for could not be found. Head back to the Rocky Mountain Wireline Service homepage to find what you need.',
  noIndex: true,
});
</script>

<template>
  <main class="page">
    <!-- The navy band, as on the locations section: a 404 is not an error the
         visitor made, so it does not get the red. -->
    <section class="bg-[var(--color-band)] px-6 py-16 text-white md:py-20">
      <div class="mx-auto max-w-6xl">
        <p class="font-[var(--font-heading)] text-7xl font-extrabold leading-none text-[var(--color-secondary)] md:text-8xl">
          404
        </p>
        <SectionHeading as="h1" invert class="mt-6">Page not found</SectionHeading>
        <p class="mt-5 max-w-xl text-lg leading-relaxed text-white">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <BaseButton to="/" variant="gold" size="lg" class="focus-ring-light w-full sm:w-auto">
            Back to Home
          </BaseButton>
          <BaseButton
            :to="site.headerCta.href"
            variant="light"
            size="lg"
            class="focus-ring-light w-full sm:w-auto"
          >
            {{ site.headerCta.label }}
          </BaseButton>
        </div>
      </div>
    </section>

    <nav v-if="site.primaryNav.length" aria-labelledby="not-found-links" class="px-6 py-12 md:py-16">
      <div class="mx-auto max-w-6xl">
        <h2 id="not-found-links" class="text-lg font-bold text-[var(--color-heading)]">
          Or go straight to
        </h2>
        <ul class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="item in site.primaryNav" :key="item.href">
            <SmartLink
              :to="item.href"
              class="focus-ring block rounded-md bg-[var(--color-bg-card)] px-5 py-4 font-semibold text-[var(--color-primary-ink)] shadow-sm ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-primary-ink-hover)] hover:ring-[var(--color-primary-ink)]"
            >
              {{ item.label }}
            </SmartLink>
          </li>
        </ul>
      </div>
    </nav>
  </main>
</template>
