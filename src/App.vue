<script setup lang="ts">
import { RouterView } from 'vue-router';
import SiteLayout from '@/components/layout/SiteLayout.vue';
</script>

<template>
  <SiteLayout>
    <!--
      Keyed by path so each route gets its own component instance.

      All seven CMS pages resolve to the same CmsPage component, and vue-router
      reuses a component instance when consecutive routes render the same one.
      Without a key, setup() never re-runs on navigation: the URL changed but
      the page kept the slug it was first mounted with, so clicking through the
      nav left the content untouched. Same for /services/a -> /services/b.
    -->
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
  </SiteLayout>
</template>
