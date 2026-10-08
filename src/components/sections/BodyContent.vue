<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import SanityImage from '@/components/ui/SanityImage.vue';
import type { Figure, PortableText as PT } from '@/types/content';
import SectionHeading from '@/components/ui/SectionHeading.vue';

const props = defineProps<{
  section: {
    heading?: string;
    body?: PT;
    image?: Figure;
    imageRight?: boolean;
  };
}>();

const hasImage = () => Boolean(props.section.image?.asset);

/**
 * The migrated pages open their body copy with an h2 rather than filling in the
 * section's heading field, so the title rendered as ordinary prose and lost the
 * gold rule every other section carries. When no heading is set, a leading h2
 * is lifted out of the copy and used as the heading instead.
 */
const leadingHeading = computed(() => {
  if (props.section.heading) return '';
  const first = props.section.body?.[0] as any;
  if (first?._type !== 'block' || first.style !== 'h2') return '';
  return (first.children ?? []).map((c: any) => c.text ?? '').join('').trim();
});

/**
 * A PNG here is almost always a cut-out with a transparent ground. A shadow and
 * rounded corners draw the outline of the file rather than of the subject, which
 * on the off-white page shows as an empty box around it.
 */
const isCutout = computed(() => /-png$/.test(props.section.image?.asset?._ref ?? ''));

const heading = computed(() => props.section.heading || leadingHeading.value);
const body = computed(() =>
  leadingHeading.value ? props.section.body?.slice(1) : props.section.body
);
</script>

<template>
  <section class="px-6 py-12 md:py-16">
    <div
      class="mx-auto grid max-w-6xl items-center gap-10 lg:gap-16"
      :class="hasImage() ? 'lg:grid-cols-2' : 'max-w-3xl'"
    >
      <!--
        `order-last` only applies from `lg` up, so on narrow screens the image
        always precedes the text regardless of which side it sits on at desktop.
      -->
      <SanityImage
        v-if="hasImage()"
        :figure="section.image"
        :width="960"
        sizes="(min-width: 1024px) 50vw, 100vw"
        :class-name="[
          isCutout ? 'w-full' : 'w-full rounded-lg shadow-lg',
          section.imageRight ? 'lg:order-last' : '',
        ].join(' ')"
      />

      <div>
        <SectionHeading v-if="heading">{{ heading }}</SectionHeading>
        <div class="prose-body" :class="heading ? 'mt-6' : ''">
          <PortableText v-if="body?.length" :value="body" />
        </div>
      </div>
    </div>
  </section>
</template>
