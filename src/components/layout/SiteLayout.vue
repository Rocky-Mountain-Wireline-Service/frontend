<script setup lang="ts">
import SiteHeader from './SiteHeader.vue';
import SiteFooter from './SiteFooter.vue';
import { useOrganizationSchema } from '@/composables/useSeo';

useOrganizationSchema();
</script>

<template>
  <!--
    No loading gate. The template blocked the whole page behind a spinner until
    two queries resolved, which meant crawlers and anyone on a slow connection
    got a spinner instead of content. Every route is prerendered with its data
    already inlined, so there is nothing to wait for.
  -->
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white"
    >
      Skip to main content
    </a>
    <SiteHeader />
    <div id="main-content" class="flex-1">
      <slot />
    </div>
    <SiteFooter />
  </div>
</template>
