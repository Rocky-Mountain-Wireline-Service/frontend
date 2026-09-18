<script setup lang="ts">
import { computed } from 'vue';
import { sanityImage } from '@/composables/useSanityImage';
import type { Figure } from '@/types/content';

const props = withDefaults(
  defineProps<{
    figure?: Figure | null;
    /** Rendered width in CSS pixels at the largest breakpoint. Drives the srcset. */
    width?: number;
    height?: number;
    sizes?: string;
    /** Above-the-fold images should load eagerly; everything else lazily. */
    eager?: boolean;
    className?: string;
  }>(),
  { width: 1200, sizes: '100vw', eager: false }
);

/** Widths the CDN is asked for. Anything wider than the source is skipped by Sanity. */
const WIDTHS = [400, 640, 960, 1280, 1920];

const base = computed(() => (props.figure?.asset ? sanityImage(props.figure) : null));

const src = computed(() => {
  if (!base.value) return '';
  let b = base.value.width(props.width).auto('format').quality(80);
  if (props.height) b = b.height(props.height).fit('crop');
  return b.url();
});

const srcset = computed(() => {
  if (!base.value) return undefined;
  return WIDTHS.map((w) => {
    let b = base.value!.width(w).auto('format').quality(80);
    if (props.height) {
      b = b.height(Math.round((props.height / props.width) * w)).fit('crop');
    }
    return `${b.url()} ${w}w`;
  }).join(', ');
});

/**
 * A decorative image takes an empty alt so screen readers skip it. An image
 * that is missing its alt text also takes an empty alt — announcing a filename
 * would be worse than silence — but that is a content gap to fix in the Studio,
 * not a state to design around.
 */
const alt = computed(() => (props.figure?.decorative ? '' : props.figure?.alt || ''));
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :srcset="srcset"
    :sizes="sizes"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
    :class="className"
  />
</template>
