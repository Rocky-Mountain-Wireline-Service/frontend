<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { PortableText } from '@portabletext/vue';
import { useSiteShell } from '@/composables/useSiteShell';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useSocialIcons } from '@/composables/useSocialIcons';
import { formatPhone, isTelHref } from '@/lib/format';
import type { ContactCard } from '@/types/content';

const site = useSiteShell();
const { pathFor, labelFor } = useSocialIcons();

const display = (card: ContactCard) =>
  isTelHref(card.href) ? formatPhone(card.value) : card.value;

const year = new Date().getFullYear();
const copyright = computed(() =>
  site.copyrightText ? `© ${year} ${site.copyrightText}` : `© ${year} ${site.name}`
);
</script>

<template>
  <footer class="bg-[var(--color-footer-bg)] text-[var(--color-footer-text)]">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div class="lg:col-span-2">
        <img
          v-if="site.footerLogo"
          :src="site.footerLogo"
          :alt="site.footerLogoAlt || site.name"
          class="h-12 w-auto object-contain"
          width="200"
          height="48"
        />
        <p v-else class="text-lg font-bold text-white">{{ site.name }}</p>

        <div v-if="site.footerMission?.length" class="footer-prose mt-5 max-w-md text-sm leading-relaxed">
          <PortableText :value="site.footerMission" />
        </div>

        <ul v-if="site.socialLinks.length" class="mt-6 flex gap-3">
          <li v-for="social in site.socialLinks" :key="social.url">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="focus-ring-light flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[var(--color-footer-text)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[#1a1a1a]"
              :aria-label="labelFor(social.platform)"
            >
              <svg viewBox="0 0 24 24" class="h-[17px] w-[17px] fill-current" aria-hidden="true">
                <path :d="pathFor(social.platform)" />
              </svg>
            </a>
          </li>
        </ul>
      </div>

      <nav v-if="site.footerNav.length" aria-labelledby="footer-links-heading">
        <h2 id="footer-links-heading" class="text-sm font-semibold uppercase tracking-wider text-white">
          {{ site.footerLinksHeading || 'Quick Links' }}
        </h2>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li v-for="item in site.footerNav" :key="item.href">
            <SmartLink
              :to="item.href"
              class="focus-ring-light text-[var(--color-footer-text)] transition-colors hover:text-[var(--color-secondary)]"
            >
              {{ item.label }}
            </SmartLink>
          </li>
        </ul>
      </nav>

      <div v-if="site.footerContactCards.length">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-white">
          {{ site.footerContactHeading || 'Contact' }}
        </h2>
        <ul class="mt-4 space-y-3 text-sm">
          <li v-for="card in site.footerContactCards" :key="card.title">
            <span class="block text-xs uppercase tracking-wide text-white/50">{{ card.title }}</span>
            <a
              v-if="card.href"
              :href="card.href"
              class="focus-ring-light text-[var(--color-footer-text)] transition-colors hover:text-[var(--color-secondary)]"
            >
              {{ display(card) }}
            </a>
            <span v-else>{{ display(card) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ copyright }}</p>

        <nav v-if="site.legalNav.length" aria-label="Legal">
          <ul class="flex flex-wrap gap-x-5 gap-y-1">
            <li v-for="item in site.legalNav" :key="item.href">
              <RouterLink
                :to="item.href"
                class="focus-ring-light text-white/60 transition-colors hover:text-[var(--color-secondary)]"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <p v-if="site.developerCredit">
          <a
            v-if="site.developerUrl"
            :href="site.developerUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="focus-ring-light text-white/60 transition-colors hover:text-[var(--color-secondary)]"
          >
            {{ site.developerCredit }}
          </a>
          <span v-else>{{ site.developerCredit }}</span>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-prose :deep(p + p) {
  margin-top: 0.75rem;
}
</style>
