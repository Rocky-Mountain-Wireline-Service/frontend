<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PortableText } from '@portabletext/vue';
import { useSanityQuery } from '@/composables/useSanityQuery';
import { useSeo } from '@/composables/useSeo';
import { LEGAL_BY_SLUG } from '@/lib/queries';
import NotFound from '@/pages/NotFound.vue';
import type { LegalPage } from '@/types/content';

const route = useRoute();
const slug = computed(() => route.path);

const { data: page, loading } = useSanityQuery<LegalPage>(LEGAL_BY_SLUG, { slug: slug.value });

const formattedDate = computed(() =>
  page.value?.lastUpdated
    ? new Date(page.value.lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
);

useSeo(
  computed(() => ({
    title: page.value?.seo?.title || page.value?.title,
    description: page.value?.seo?.description,
    image: page.value?.seo?.image,
    noIndex: page.value?.seo?.noIndex,
    ready: Boolean(page.value),
  }))
);
</script>

<template>
  <NotFound v-if="!loading && !page" />

  <main v-else class="page mx-auto max-w-3xl px-6 py-16 md:py-24">
    <h1 class="text-balance text-4xl font-bold">{{ page?.title }}</h1>
    <p v-if="formattedDate" class="mt-3 text-sm text-[var(--color-text-muted)]">
      Last updated
      <time :datetime="page?.lastUpdated">{{ formattedDate }}</time>
    </p>
    <div class="prose-body mt-8">
      <PortableText v-if="page?.body?.length" :value="page.body" />
    </div>
  </main>
</template>
