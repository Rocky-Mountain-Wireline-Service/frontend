<script setup lang="ts">
import { sectionMap } from '@/composables/useSections';
import type { Section } from '@/types/content';

defineProps<{ sections?: Section[] }>();
</script>

<template>
  <template v-for="section in sections ?? []" :key="section._key">
    <component :is="sectionMap[section._type]" v-if="sectionMap[section._type]" :section="section" />
  </template>
</template>
