<script setup lang="ts">
import { computed } from 'vue';
import { PortableText } from '@portabletext/vue';
import { useSiteShell } from '@/composables/useSiteShell';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useSocialIcons } from '@/composables/useSocialIcons';
import { formatPhone, isTelHref } from '@/lib/format';
import { Phone, Mail, MapPin } from 'lucide-vue-next';
import type { ContactCard } from '@/types/content';

const site = useSiteShell();
const { tileFor, labelFor } = useSocialIcons();

const display = (card: ContactCard) =>
  isTelHref(card.href) ? formatPhone(card.value) : card.value;

/** Matches the card's label to an icon, as the live footer does. */
const iconFor = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('phone') || t.includes('call')) return Phone;
  if (t.includes('email') || t.includes('mail')) return Mail;
  return MapPin;
};

const year = new Date().getFullYear();
const copyright = computed(() =>
  site.copyrightText ? `© ${year} ${site.copyrightText}` : `© ${year} ${site.name}`
);
</script>

<template>
  <footer class="bg-[var(--color-footer-bg)] text-[var(--color-footer-text)]">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-14">
      <div>
        <img
          v-if="site.footerLogo"
          :src="site.footerLogo"
          :alt="site.footerLogoAlt || site.name"
          class="h-20 w-auto object-contain"
          width="280"
          height="80"
        />
        <p v-else class="font-[var(--font-heading)] text-lg font-bold text-white">{{ site.name }}</p>

        <div v-if="site.footerMission?.length" class="footer-prose mt-5 text-sm leading-relaxed text-[var(--color-footer-muted)]">
          <PortableText :value="site.footerMission" />
        </div>
      </div>

      <nav v-if="site.footerNav.length" aria-labelledby="footer-links-heading">
        <h2 id="footer-links-heading" class="footer-heading">
          {{ site.footerLinksHeading || 'Quick Links' }}
        </h2>
        <ul class="mt-5 space-y-2.5 text-sm">
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

      <div>
        <h2 v-if="site.footerContactCards.length" class="footer-heading">
          {{ site.footerContactHeading || 'Contact' }}
        </h2>
        <ul v-if="site.footerContactCards.length" class="mt-5 space-y-4 text-sm">
          <li v-for="card in site.footerContactCards" :key="card.title" class="flex items-start gap-3">
            <component
              :is="iconFor(card.title)"
              :size="18"
              class="mt-0.5 shrink-0 text-[var(--color-secondary)]"
              aria-hidden="true"
            />
            <div>
              <span class="sr-only">{{ card.title }}: </span>
              <a
                v-if="card.href"
                :href="card.href"
                class="focus-ring-light text-[var(--color-footer-text)] transition-colors hover:text-[var(--color-secondary)]"
              >
                {{ display(card) }}
              </a>
              <span v-else>{{ display(card) }}</span>
            </div>
          </li>
        </ul>

        <ul v-if="site.socialLinks.length" class="mt-7 flex gap-4">
          <li v-for="social in site.socialLinks" :key="social.url">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-tile focus-ring-light"
              :aria-label="labelFor(social.platform)"
            >
              <svg
                viewBox="0 0 24 24"
                class="fill-current"
                :class="tileFor(social.platform).full ? 'h-full w-full' : 'h-7 w-7'"
                aria-hidden="true"
              >
                <path :d="tileFor(social.platform).path" />
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Navy utility bar, as on the live site. -->
    <div class="bg-[var(--color-footer-bar)] text-white">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
      >
        <p>{{ copyright }}</p>

        <nav v-if="site.legalNav.length" aria-label="Legal">
          <ul class="flex flex-wrap gap-x-5 gap-y-1">
            <li v-for="item in site.legalNav" :key="item.href">
              <!-- SmartLink, not RouterLink: the MRF entry points off-site, and
                   the router would resolve an absolute URL as an internal path. -->
              <SmartLink
                :to="item.href"
                class="focus-ring-light text-white transition-colors hover:text-[var(--color-secondary)]"
              >
                {{ item.label }}
              </SmartLink>
            </li>
          </ul>
        </nav>

        <p v-if="site.developerCredit">
          <a
            v-if="site.developerUrl"
            :href="site.developerUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="focus-ring-light text-white transition-colors hover:text-[var(--color-secondary)]"
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
/*
  A solid gold tile with the mark cut into it, as on the previous site, at a
  size that clears the 44px touch target. Hover brightens the tile and adds a
  soft gold halo — a change of light rather than of position, so nothing moves
  for anyone who has asked for reduced motion.
*/
.social-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: var(--color-secondary);
  color: var(--color-footer-bg);
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.social-tile:hover {
  background-color: #f2cf5b;
  color: var(--color-footer-bg);
  box-shadow: 0 0 0 3px rgb(214 166 22 / 0.35), 0 0 18px 2px rgb(214 166 22 / 0.55);
}

/* The gold rule again, at the smaller weight the live footer uses. */
.footer-heading {
  display: inline-block;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid var(--color-secondary);
  color: #ffffff;
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 700;
}

.footer-prose :deep(p + p) {
  margin-top: 0.75rem;
}
</style>
