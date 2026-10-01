<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PortableText } from '@portabletext/vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { useSanityQuery } from '@/composables/useSanityQuery';
import { useSeo } from '@/composables/useSeo';
import { useHashScroll } from '@/composables/useHashScroll';
import { track } from '@/lib/analytics';
import { SERVICE_BY_SLUG } from '@/lib/queries';
import SanityImage from '@/components/ui/SanityImage.vue';
import NotFound from '@/pages/NotFound.vue';
import type { ServicePage } from '@/types/content';

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ''));

const { data: service, loading } = useSanityQuery<ServicePage>(SERVICE_BY_SLUG, { slug: slug.value });

/**
 * Flatten Portable Text to a search description when the client has not written
 * one, truncating on a word boundary so the snippet does not end mid-word.
 */
const derivedDescription = computed(() => {
  if (service.value?.summary) return service.value.summary;
  const blocks = service.value?.content ?? [];
  const text = blocks
    .filter((b: any) => b._type === 'block')
    .flatMap((b: any) => (b.children ?? []).map((c: any) => c.text ?? ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return undefined;
  if (text.length <= 155) return text;
  return `${text.slice(0, text.lastIndexOf(' ', 152))}…`;
});

useSeo(
  computed(() => ({
    title: service.value?.seo?.title || service.value?.title,
    description:
      service.value?.seo?.description ||
      derivedDescription.value ||
      `${service.value?.title ?? 'Wireline services'} from Rocky Mountain Wireline Service. Contact us to request a quote for your next job.`,
    image: service.value?.seo?.image || service.value?.image,
    noIndex: service.value?.seo?.noIndex,
    ready: Boolean(service.value),
  }))
);

useHashScroll(computed(() => Boolean(service.value)));
</script>

<template>
  <NotFound v-if="!loading && !service" />

  <main v-else class="page">
    <section class="relative isolate flex min-h-[40vh] items-end overflow-hidden">
      <SanityImage
        v-if="service?.image?.asset"
        :figure="service.image"
        :width="1920"
        :height="800"
        sizes="100vw"
        eager
        class-name="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        class="absolute inset-0 -z-10"
        :class="
          service?.image?.asset
            ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/25'
            : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]'
        "
      />
      <div class="mx-auto w-full max-w-4xl px-6 py-16">
        <RouterLink
          to="/services"
          class="focus-ring-light inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white"
        >
          <ArrowLeft :size="16" aria-hidden="true" />
          All services
        </RouterLink>
        <h1 class="mt-4 text-balance text-4xl font-bold text-white sm:text-5xl">
          {{ service?.title }}
        </h1>
      </div>
    </section>

    <div class="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <div class="prose-body">
        <PortableText v-if="service?.content?.length" :value="service.content" />
      </div>

      <div class="mt-14 rounded-lg bg-[var(--color-bg-secondary)] p-8 text-center ring-1 ring-[var(--color-border)]">
        <p class="text-xl font-semibold">Need this service on your next job?</p>
        <RouterLink
          to="/contact#contact-form"
          class="focus-ring mt-5 inline-flex rounded-md bg-[var(--color-primary)] px-8 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          @click="track('quote_cta_click', { placement: 'service_detail', service: service?.title })"
        >
          Contact Sales
        </RouterLink>
      </div>
    </div>
  </main>
</template>
