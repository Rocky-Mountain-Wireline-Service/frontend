<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSanityQuery } from '@/composables/useSanityQuery';
import { useSeo } from '@/composables/useSeo';
import PageSections from '@/components/layout/PageSections.vue';
import type { Figure, Page } from '@/types/content';

/**
 * Every composed page renders through this one component.
 *
 * The template shipped seven page files that differed only in the slug they
 * queried. The route already carries the slug, so the duplication bought
 * nothing — and each copy was one more place to forget a fix.
 */
const route = useRoute();
const slug = computed(() => (route.meta.slug as string) ?? route.path);

const { data: page } = useSanityQuery<Page>(
  `*[_type == "page" && slug.current == $slug][0]{
    title, "slug": slug.current,
    seo{ ..., image{ ..., alt, decorative, asset, crop, hotspot } },
    sections[]{
      ...,
      _type == "servicesGrid" => {
        heading, intro,
        "services": coalesce(
          services[]->{ _id, title, summary, "slug": slug.current, image },
          *[_type == "servicePage"] | order(title asc){ _id, title, summary, "slug": slug.current, image }
        )
      },
      _type == "formSection" => {
        heading, intro,
        "form": form->{ _id, title, "slug": slug.current, active, description, fields, successMessage, spamProtection }
      }
    }
  }`,
  { slug: slug.value }
);

const hero = computed(() => page.value?.sections?.find((s) => s._type === 'heroSection'));
const firstHeroHeading = computed(() => hero.value?.heading as string | undefined);
const firstHeroImage = computed(() => (hero.value?.image ?? null) as Figure | null);

useSeo(
  computed(() => ({
    title: page.value?.seo?.title || page.value?.title,
    description: page.value?.seo?.description,
    image: page.value?.seo?.image,
    noIndex: page.value?.seo?.noIndex,
    ready: Boolean(page.value),
    fallbackHeading: firstHeroHeading.value,
    fallbackImage: firstHeroImage.value,
  }))
);
</script>

<template>
  <main class="page">
    <PageSections :sections="page?.sections" />
  </main>
</template>
