<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Menu, X, Sun, Moon } from 'lucide-vue-next';
import { useSiteShell } from '@/composables/useSiteShell';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useTheme } from '@/composables/useTheme';
import { track } from '@/lib/analytics';

const site = useSiteShell();
const route = useRoute();
const mobileOpen = ref(false);
const { isDark, toggle: toggleTheme, label: themeLabel } = useTheme();

const onQuoteClick = (placement: string) => track('quote_cta_click', { placement });

// Close the menu on navigation, so a link tapped in the drawer does not leave
// it covering the page it just opened.
watch(() => route.fullPath, () => { mobileOpen.value = false; });
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
      <RouterLink to="/" class="focus-ring flex shrink-0 items-center" :aria-label="`${site.name} — home`">
        <img
          v-if="site.logo"
          :src="site.logo"
          :alt="site.logoAlt || site.name"
          class="h-9 w-auto object-contain"
          width="160"
          height="36"
        />
        <span v-else class="text-lg font-bold text-[var(--color-primary-ink)]">{{ site.name }}</span>
      </RouterLink>

      <nav class="hidden items-center gap-7 lg:flex" aria-label="Main">
        <SmartLink
          v-for="item in site.primaryNav"
          :key="item.href"
          :to="item.href"
          class="focus-ring text-[0.9375rem] font-medium text-[var(--color-text)] transition-colors hover:text-[var(--color-primary-ink)] [&.router-link-active]:text-[var(--color-primary-ink)]"
        >
          {{ item.label }}
        </SmartLink>
      </nav>

      <div class="flex items-center gap-3">
        <RouterLink
          :to="site.headerCta.href"
          class="focus-ring hidden rounded-md bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] sm:inline-flex"
          @click="onQuoteClick('header')"
        >
          {{ site.headerCta.label }}
        </RouterLink>

        <button
          type="button"
          class="focus-ring rounded-md p-1.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-hover)]"
          :title="themeLabel"
          :aria-label="themeLabel"
          :aria-pressed="isDark"
          @click="toggleTheme"
        >
          <!-- Shows the destination, not the current state: a sun means "go light". -->
          <Sun v-if="isDark" :size="20" aria-hidden="true" />
          <Moon v-else :size="20" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="focus-ring -mr-1 rounded-md p-1.5 text-[var(--color-text)] lg:hidden"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" :size="24" aria-hidden="true" />
          <Menu v-else :size="24" aria-hidden="true" />
        </button>
      </div>
    </div>

    <nav
      v-show="mobileOpen"
      id="mobile-nav"
      class="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4 lg:hidden"
      aria-label="Main"
    >
      <SmartLink
        v-for="item in site.primaryNav"
        :key="item.href"
        :to="item.href"
        class="focus-ring block py-2.5 font-medium text-[var(--color-text)] hover:text-[var(--color-primary-ink)] [&.router-link-active]:text-[var(--color-primary-ink)]"
      >
        {{ item.label }}
      </SmartLink>
      <RouterLink
        :to="site.headerCta.href"
        class="focus-ring mt-3 block rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-center font-semibold text-white sm:hidden"
        @click="onQuoteClick('mobile_menu')"
      >
        {{ site.headerCta.label }}
      </RouterLink>
    </nav>
  </header>
</template>
