<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Renders as h1 on a page's leading section, h2 elsewhere. */
    as?: 'h1' | 'h2' | 'h3';
    align?: 'left' | 'center';
    /** On a dark band the rule and text invert to stay legible. */
    invert?: boolean;
  }>(),
  { as: 'h2', align: 'left', invert: false }
);
</script>

<template>
  <!--
    The uppercase title over a 5px gold rule is the live site's most
    recognisable piece of brand vocabulary, repeated on every section. It lives
    in one component so the rule's weight, colour and spacing cannot drift
    between sections the way they had in the original stylesheets.
  -->
  <component
    :is="as"
    class="section-heading"
    :class="[
      align === 'center' ? 'section-heading--center' : '',
      invert ? 'section-heading--invert' : '',
    ]"
  >
    <span class="section-heading__text"><slot /></span>
  </component>
</template>

<style scoped>
.section-heading {
  color: var(--color-heading);
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.15;
  text-wrap: balance;
  /* 30px on the live site; a touch larger here and fluid, so it does not
     crowd on phones or look undersized on a wide monitor. */
  font-size: clamp(1.5rem, 1.15rem + 1.45vw, 1.95rem);
}

/*
  The rule hugs the text rather than spanning the column. On the live site it
  stretches the full container width, which on a short heading leaves a long
  gold line trailing into empty space.
*/
.section-heading__text {
  display: inline-block;
  padding-bottom: 0.3125rem;
  border-bottom: 5px solid var(--color-rule);
}

.section-heading--center {
  text-align: center;
}

.section-heading--invert {
  color: #ffffff;
}
</style>
