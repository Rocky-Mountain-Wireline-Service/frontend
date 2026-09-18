<script setup lang="ts">
import SmartLink from '@/components/ui/SmartLink.vue';

withDefaults(
  defineProps<{
    to?: string;
    /**
     * solid   — red fill, the primary action
     * gold    — gold fill with red text, the secondary action
     * outline — red rule on transparent, used for "Read More"
     * light   — white rule on transparent, for use on dark or photographic grounds
     */
    variant?: 'solid' | 'gold' | 'outline' | 'light';
    size?: 'md' | 'lg';
  }>(),
  { variant: 'solid', size: 'md' }
);
</script>

<template>
  <component
    :is="to ? SmartLink : 'button'"
    v-bind="to ? { to } : { type: 'button' }"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px solid transparent;
  /* 5px on the live site — a soft corner rather than a pill. */
  border-radius: 5px;
  font-family: var(--font-body);
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.btn--md { padding: 0.625rem 1.5rem; font-size: 0.9375rem; }
.btn--lg { padding: 0.8125rem 2rem; font-size: 1.0625rem; }

.btn--solid {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
}
.btn--solid:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: #ffffff;
}

/* Gold carries near-black text: white on this gold measures 2.2:1. */
.btn--gold {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: #1a1a1a;
}
.btn--gold:hover {
  background-color: var(--color-secondary-hover);
  border-color: var(--color-secondary-hover);
  color: #1a1a1a;
}

.btn--outline {
  background-color: transparent;
  border-color: var(--color-primary-ink);
  color: var(--color-primary-ink);
}
.btn--outline:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
}

.btn--light {
  background-color: transparent;
  border-color: #ffffff;
  color: #ffffff;
}
.btn--light:hover {
  background-color: #ffffff;
  color: var(--color-primary);
}
</style>
